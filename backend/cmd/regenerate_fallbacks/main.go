package main

import (
	"log"
	"time"

	"github.com/joho/godotenv"
	"github.com/stashlog/backend/config"
	"github.com/stashlog/backend/db"
	"github.com/stashlog/backend/models"
	"github.com/stashlog/backend/services"
)

func main() {
	// Load environment variables
	godotenv.Load()
	cfg := config.Load()

	// Connect to database
	db.Connect(cfg)

	log.Println("Starting manual regeneration of fallback summaries...")

	var fallbacks []models.Summary
	err := db.DB.Where("is_fallback = ? AND summary_type = ?", true, models.SummaryTypeDaily).Find(&fallbacks).Error
	if err != nil {
		log.Fatalf("Failed to query fallback summaries: %v", err)
	}

	log.Printf("Found %d fallback summaries to regenerate", len(fallbacks))

	geminiService := services.NewGeminiService(cfg)

	for _, summary := range fallbacks {
		log.Printf("Regenerating summary for user %s on date %s...", summary.UserID, summary.LogDate.Format("2006-01-02"))

		generatedSummary, isFallback := geminiService.GenerateDailySummary(summary.RawLogs)
		if isFallback {
			log.Printf("Gemini call still returned fallback for user %s on date %s (verify your API key/limits)", summary.UserID, summary.LogDate.Format("2006-01-02"))
			continue
		}

		// Update database
		summary.GeneratedSummary = generatedSummary
		summary.IsFallback = false
		summary.GeneratedAt = time.Now()
		
		if err := db.DB.Save(&summary).Error; err != nil {
			log.Printf("Failed to save updated summary for user %s: %v", summary.UserID, err)
		} else {
			log.Printf("Successfully updated summary for user %s on date %s", summary.UserID, summary.LogDate.Format("2006-01-02"))
		}
	}

	log.Println("Regeneration finished successfully!")
}
