// Package auth resolves the caller's identity and role from the headers the
// API gateway injects once it has already validated the caller's Thunder
// token — this service never sees, parses or verifies a JWT itself.
package auth

import (
	"encoding/json"
	"net/http"
	"strings"
)

// Role names, matched against specs/design/security.json's roles[].name.
const (
	RoleViewer = "Viewer"
	RoleAdmin  = "Admin"

	// ColdStartRole is granted to a caller whose groups match no declared
	// role, per specs/design/security.json's coldStartRole.
	ColdStartRole = RoleViewer
)

// Caller is the identity and role resolved from the gateway-injected
// X-User-Id / X-User-Groups headers.
type Caller struct {
	UserID string
	Role   string
}

// Resolve extracts the caller from the request. It reports false when
// X-User-Id is missing, which means the request did not come through the
// gateway — callers answer 401 in that case, per api-management.
func Resolve(r *http.Request) (Caller, bool) {
	userID := r.Header.Get("X-User-Id")
	if userID == "" {
		return Caller{}, false
	}
	return Caller{
		UserID: userID,
		Role:   resolveRole(r.Header.Get("X-User-Groups")),
	}, true
}

// resolveRole matches the caller's groups against the declared role names
// case-insensitively (a substring match survives the org renaming its
// groups), falling back to ColdStartRole when nothing matches.
func resolveRole(raw string) string {
	role := ""
	for _, group := range parseGroups(raw) {
		lower := strings.ToLower(strings.TrimSpace(group))
		if strings.Contains(lower, "admin") {
			return RoleAdmin
		}
		if strings.Contains(lower, "viewer") {
			role = RoleViewer
		}
	}
	if role != "" {
		return role
	}
	return ColdStartRole
}

// parseGroups accepts the gateway's JSON array form, falling back to a
// comma-separated string.
func parseGroups(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	var groups []string
	if err := json.Unmarshal([]byte(raw), &groups); err == nil {
		return groups
	}
	return strings.Split(raw, ",")
}
