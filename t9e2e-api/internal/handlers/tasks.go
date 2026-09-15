// Package handlers implements the Task Board HTTP API exactly per
// specs/design/components/t9e2e-api/openapi.yaml.
package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"t9e2e-api/internal/auth"
	"t9e2e-api/internal/models"
	"t9e2e-api/internal/store"
)

// TaskHandler serves the /tasks endpoints.
type TaskHandler struct {
	store *store.Store
}

// NewTaskHandler builds a TaskHandler backed by the given store.
func NewTaskHandler(s *store.Store) *TaskHandler {
	return &TaskHandler{store: s}
}

// ListTasks handles GET /tasks — any signed-in caller (Viewer or Admin).
func (h *TaskHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	if _, ok := auth.Resolve(r); !ok {
		writeError(w, http.StatusUnauthorized, "missing or invalid token")
		return
	}

	limit, offset := parsePaging(r)

	count, tasks, err := h.store.ListTasks(r.Context(), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list tasks")
		return
	}

	writeJSON(w, http.StatusOK, models.TaskPage{
		Count:    count,
		Data:     tasks,
		Next:     pageLink(limit, offset+limit, count),
		Previous: pageLink(limit, offset-limit, count),
	})
}

// CreateTask handles POST /tasks — Admin only.
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	caller, ok := auth.Resolve(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "missing or invalid token")
		return
	}
	if caller.Role != auth.RoleAdmin {
		writeError(w, http.StatusForbidden, "caller is not an Admin")
		return
	}

	var in models.NewTask
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(in.Title) == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}

	task, err := h.store.CreateTask(r.Context(), in.Title, caller.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create task")
		return
	}
	writeJSON(w, http.StatusCreated, task)
}

// CompleteTask handles POST /tasks/{taskId}/complete — Admin only.
func (h *TaskHandler) CompleteTask(w http.ResponseWriter, r *http.Request) {
	caller, ok := auth.Resolve(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "missing or invalid token")
		return
	}
	if caller.Role != auth.RoleAdmin {
		writeError(w, http.StatusForbidden, "caller is not an Admin")
		return
	}

	taskID := r.PathValue("taskId")
	task, found, err := h.store.CompleteTask(r.Context(), taskID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to complete task")
		return
	}
	if !found {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	writeJSON(w, http.StatusOK, task)
}

// parsePaging reads limit/offset query params, clamping to the contract's
// bounds (limit default 20 max 100, offset default 0) rather than 400-ing —
// GET /tasks documents only 200/401.
func parsePaging(r *http.Request) (limit, offset int) {
	limit, offset = 20, 0
	q := r.URL.Query()
	if v, err := strconv.Atoi(q.Get("limit")); err == nil && v >= 0 {
		limit = v
	}
	if limit > 100 {
		limit = 100
	}
	if v, err := strconv.Atoi(q.Get("offset")); err == nil && v >= 0 {
		offset = v
	}
	return limit, offset
}

// pageLink builds a relative next/previous URI, or nil when it would fall
// outside [0, count).
func pageLink(limit, offset, count int) *string {
	if offset < 0 || offset >= count {
		return nil
	}
	q := url.Values{}
	q.Set("limit", strconv.Itoa(limit))
	q.Set("offset", strconv.Itoa(offset))
	link := "/tasks?" + q.Encode()
	return &link
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, models.ErrorResponse{Code: status, Message: message})
}
