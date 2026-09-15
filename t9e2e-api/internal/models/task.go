// Package models holds the request/response and domain types for the task
// board API, matching specs/design/components/t9e2e-api/openapi.yaml.
package models

import "time"

// Task is the board's core entity.
type Task struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Completed   bool       `json:"completed"`
	CreatedBy   string     `json:"createdBy"`
	CreatedAt   time.Time  `json:"createdAt"`
	CompletedAt *time.Time `json:"completedAt"`
}

// NewTask is the create-task request body.
type NewTask struct {
	Title string `json:"title"`
}

// TaskPage is the paginated envelope returned by GET /tasks.
type TaskPage struct {
	Count    int     `json:"count"`
	Next     *string `json:"next"`
	Previous *string `json:"previous"`
	Data     []Task  `json:"data"`
}

// ErrorResponse is the shared error shape for every 4xx/5xx response.
type ErrorResponse struct {
	Code        int    `json:"code"`
	Message     string `json:"message"`
	Description string `json:"description,omitempty"`
	MoreInfo    string `json:"moreInfo,omitempty"`
}
