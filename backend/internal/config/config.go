package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL         string
	CERTHMACSecret      string
	PersonaWebhookSecret string
	SupabaseJWTSecret   string
	Port                string
	CORSOrigin         string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "http://localhost:3000"
	}

	return &Config{
		DatabaseURL:          os.Getenv("DATABASE_URL"),
		CERTHMACSecret:       os.Getenv("CERT_HMAC_SECRET"),
		PersonaWebhookSecret: os.Getenv("PERSONA_WEBHOOK_SECRET"),
		SupabaseJWTSecret:     os.Getenv("SUPABASE_JWT_SECRET"),
		Port:                 port,
		CORSOrigin:           corsOrigin,
	}, nil
}
