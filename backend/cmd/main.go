package main

import (
	"log"
	"os"
	_ "time/tzdata"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/stashlog/backend/config"
	"github.com/stashlog/backend/db"
	"github.com/stashlog/backend/routes"
	"github.com/stashlog/backend/services"
)

func main() {
	// Load .env file (ignore error for production where env vars are set directly)
	godotenv.Load()

	cfg := config.Load()

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	db.Connect(cfg)

	// Run migrations
	db.RunMigrations(cfg)

	// Initialize services
	geminiService := services.NewGeminiService(cfg)
	emailService := services.NewEmailService(cfg)
	cronService := services.NewCronService(cfg, geminiService, emailService)

	// Start cron jobs
	cronService.Start()
	defer cronService.Stop()

	// Setup router
	router := gin.Default()

	// Setup routes
	routes.Setup(router, cfg, geminiService, emailService)

	// Start server
	port := cfg.Port
	log.Printf("Stashlog backend starting on port %s", port)
	log.Printf("Mock mode: %v", cfg.MockMode)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// Trigger deploy
