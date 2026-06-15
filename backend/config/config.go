package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port             string
	FrontendURL      string
	DatabaseURL      string
	JWTSecret        string
	JWTRefreshSecret string
	GoogleClientID   string
	GoogleClientSecret string
	GeminiAPIKey     string
	GeminiModel      string
	BrevoAPIKey      string
	BrevoSenderEmail string
	BrevoSenderName  string
	MockMode         bool
}

func Load() *Config {
	mockMode, _ := strconv.ParseBool(getEnv("MOCK_MODE", "true"))

	return &Config{
		Port:             getEnv("PORT", "8080"),
		FrontendURL:      getEnv("FRONTEND_URL", "http://localhost:5173"),
		DatabaseURL:      getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/stashlog?sslmode=disable"),
		JWTSecret:        getEnv("JWT_SECRET", "super-secret-access-token-key-stashlog"),
		JWTRefreshSecret: getEnv("JWT_REFRESH_SECRET", "super-secret-refresh-token-key-stashlog"),
		GoogleClientID:   getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GeminiAPIKey:     getEnv("GEMINI_API_KEY", ""),
		GeminiModel:      getEnv("GEMINI_MODEL", "gemini-2.5-flash"),
		BrevoAPIKey:      getEnv("BREVO_API_KEY", ""),
		BrevoSenderEmail: getEnv("BREVO_SENDER_EMAIL", ""),
		BrevoSenderName:  getEnv("BREVO_SENDER_NAME", "Stashlog"),
		MockMode:         mockMode,
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
