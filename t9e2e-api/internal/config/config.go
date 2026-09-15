// Package config reads this service's configuration from environment
// variables, in one place, at startup. Every setting has a sensible default
// so the service starts with no required environment variables; the
// platform overrides them with the values it injects for the t9e2e-db
// platform-resource dependency.
package config

import "os"

// Config holds the connection settings for the t9e2e-db Postgres dependency.
type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
}

// Load reads the config from the environment, falling back to local
// defaults for anything unset.
func Load() Config {
	return Config{
		DBHost:     getenv("T9E2E_DB_HOST", "localhost"),
		DBPort:     getenv("T9E2E_DB_PORT", "5432"),
		DBUser:     getenv("T9E2E_DB_USER", "postgres"),
		DBPassword: getenv("T9E2E_DB_PASSWORD", "postgres"),
		DBName:     getenv("T9E2E_DB_DBNAME", "t9e2e"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
