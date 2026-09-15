// Package store owns Postgres access for the task board: schema creation
// and the queries backing each endpoint.
package store

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"t9e2e-api/internal/config"
	"t9e2e-api/internal/models"
)

// Store wraps a Postgres connection pool.
type Store struct {
	pool *pgxpool.Pool
}

// New opens the pool from the injected t9e2e-db connection settings and
// creates the schema if it does not already exist, so re-deploys are
// idempotent.
func New(ctx context.Context, cfg config.Config) (*Store, error) {
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("open pool: %w", err)
	}

	s := &Store{pool: pool}
	if err := s.migrate(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("migrate: %w", err)
	}
	return s, nil
}

// Close releases the pool's connections.
func (s *Store) Close() {
	s.pool.Close()
}

func (s *Store) migrate(ctx context.Context) error {
	_, err := s.pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS tasks (
			id           TEXT PRIMARY KEY,
			title        TEXT NOT NULL,
			completed    BOOLEAN NOT NULL DEFAULT FALSE,
			created_by   TEXT NOT NULL,
			created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
			completed_at TIMESTAMPTZ
		)
	`)
	return err
}

// ListTasks returns the total matching count plus one page of tasks ordered
// oldest-first.
func (s *Store) ListTasks(ctx context.Context, limit, offset int) (int, []models.Task, error) {
	var count int
	if err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM tasks`).Scan(&count); err != nil {
		return 0, nil, err
	}

	rows, err := s.pool.Query(ctx, `
		SELECT id, title, completed, created_by, created_at, completed_at
		FROM tasks
		ORDER BY created_at ASC, id ASC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()

	tasks := make([]models.Task, 0, limit)
	for rows.Next() {
		var t models.Task
		if err := rows.Scan(&t.ID, &t.Title, &t.Completed, &t.CreatedBy, &t.CreatedAt, &t.CompletedAt); err != nil {
			return 0, nil, err
		}
		tasks = append(tasks, t)
	}
	if err := rows.Err(); err != nil {
		return 0, nil, err
	}
	return count, tasks, nil
}

// CreateTask inserts a new task owned by createdBy (the caller's X-User-Id).
func (s *Store) CreateTask(ctx context.Context, title, createdBy string) (models.Task, error) {
	id, err := newID()
	if err != nil {
		return models.Task{}, err
	}

	var t models.Task
	err = s.pool.QueryRow(ctx, `
		INSERT INTO tasks (id, title, completed, created_by, created_at)
		VALUES ($1, $2, FALSE, $3, now())
		RETURNING id, title, completed, created_by, created_at, completed_at
	`, id, title, createdBy).Scan(&t.ID, &t.Title, &t.Completed, &t.CreatedBy, &t.CreatedAt, &t.CompletedAt)
	if err != nil {
		return models.Task{}, err
	}
	return t, nil
}

// CompleteTask marks a task complete and returns it. found is false when no
// task matches id.
func (s *Store) CompleteTask(ctx context.Context, id string) (task models.Task, found bool, err error) {
	err = s.pool.QueryRow(ctx, `
		UPDATE tasks
		SET completed = TRUE, completed_at = now()
		WHERE id = $1
		RETURNING id, title, completed, created_by, created_at, completed_at
	`, id).Scan(&task.ID, &task.Title, &task.Completed, &task.CreatedBy, &task.CreatedAt, &task.CompletedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Task{}, false, nil
		}
		return models.Task{}, false, err
	}
	return task, true, nil
}

// newID generates a random UUIDv4 string without pulling in an extra
// dependency.
func newID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]), nil
}
