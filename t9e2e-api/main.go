// Command t9e2e-api serves the shared task board's list/create/complete API.
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"t9e2e-api/internal/config"
	"t9e2e-api/internal/handlers"
	"t9e2e-api/internal/store"
)

func main() {
	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	db, err := store.New(ctx, cfg)
	if err != nil {
		log.Fatalf("t9e2e-api: failed to initialize database: %v", err)
	}
	defer db.Close()

	taskHandler := handlers.NewTaskHandler(db)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /tasks", taskHandler.ListTasks)
	mux.HandleFunc("POST /tasks", taskHandler.CreateTask)
	mux.HandleFunc("POST /tasks/{taskId}/complete", taskHandler.CompleteTask)

	srv := &http.Server{
		Addr:              ":9090",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("t9e2e-api: listening on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("t9e2e-api: server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	_ = srv.Shutdown(shutdownCtx)
}
