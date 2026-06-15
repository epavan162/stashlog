package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stashlog/backend/config"
	"github.com/stashlog/backend/db"
	"github.com/stashlog/backend/middleware"
	"github.com/stashlog/backend/models"
	"github.com/stashlog/backend/services"
)

type SummaryHandler struct {
	cfg           *config.Config
	geminiService *services.GeminiService
}

func NewSummaryHandler(cfg *config.Config, geminiService *services.GeminiService) *SummaryHandler {
	return &SummaryHandler{cfg: cfg, geminiService: geminiService}
}

func (h *SummaryHandler) GetSummaries(c *gin.Context) {
	userID := middleware.GetUserID(c)

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := db.DB.Where("user_id = ?", userID).Order("log_date DESC")

	if startDate != "" {
		if sd, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("log_date >= ?", sd)
		}
	}

	if endDate != "" {
		if ed, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("log_date <= ?", ed)
		}
	}

	var summaries []models.Summary
	if err := query.Find(&summaries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch summaries"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summaries": summaries})
}

func (h *SummaryHandler) GetSummaryByDate(c *gin.Context) {
	userID := middleware.GetUserID(c)
	dateStr := c.Param("date")

	logDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	var summary models.Summary
	if err := db.DB.Where("user_id = ? AND log_date = ? AND summary_type = ?", userID, logDate, models.SummaryTypeDaily).First(&summary).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No summary found for this date"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

func (h *SummaryHandler) RegenerateSummary(c *gin.Context) {
	userID := middleware.GetUserID(c)
	dateStr := c.Param("date")

	logDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	// Check existing summary
	var summary models.Summary
	err = db.DB.Where("user_id = ? AND log_date = ? AND summary_type = ?", userID, logDate, models.SummaryTypeDaily).First(&summary).Error

	if err == nil && summary.RegenerationCount >= 3 {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "Maximum 3 regenerations per day allowed"})
		return
	}

	// Get all logs for this date
	var logs []models.Log
	db.DB.Where("user_id = ? AND log_date = ?", userID, logDate).Find(&logs)

	if len(logs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No logs found for this date"})
		return
	}

	// Merge logs with tag context
	rawLogs := fmt.Sprintf("User had %d log entries today:\n", len(logs))
	for _, l := range logs {
		tag := "General"
		if len(l.Tags) > 0 {
			tag = l.Tags[0]
		}
		rawLogs += fmt.Sprintf("[%s] %s\n", tag, l.Content)
	}

	// Generate with Gemini
	generatedSummary, isFallback := h.geminiService.GenerateDailySummary(rawLogs)

	if err != nil {
		// Create new summary
		summary = models.Summary{
			UserID:            userID,
			LogDate:           logDate,
			SummaryType:       models.SummaryTypeDaily,
			RawLogs:           rawLogs,
			GeneratedSummary:  generatedSummary,
			RegenerationCount: 0,
			IsFallback:        isFallback,
			GeneratedAt:       time.Now(),
		}
		db.DB.Create(&summary)
	} else {
		// Update existing
		summary.GeneratedSummary = generatedSummary
		summary.RegenerationCount++
		summary.IsFallback = isFallback
		summary.GeneratedAt = time.Now()
		summary.RawLogs = rawLogs
		db.DB.Save(&summary)
	}

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

func (h *SummaryHandler) GetWeeklySummary(c *gin.Context) {
	userID := middleware.GetUserID(c)
	weekStr := c.Param("week") // Format: 2024-W01 or 2024-01-01 (Monday of the week)

	weekDate, err := time.Parse("2006-01-02", weekStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD of any day in the week."})
		return
	}

	// Find the Monday of this week
	weekday := weekDate.Weekday()
	if weekday == time.Sunday {
		weekday = 7
	}
	monday := weekDate.AddDate(0, 0, -int(weekday-time.Monday))
	friday := monday.AddDate(0, 0, 4)

	var summary models.Summary
	if err := db.DB.Where("user_id = ? AND log_date = ? AND summary_type = ?", userID, monday, models.SummaryTypeWeekly).First(&summary).Error; err != nil {
		// Try to find daily summaries for the week
		var dailySummaries []models.Summary
		db.DB.Where("user_id = ? AND log_date >= ? AND log_date <= ? AND summary_type = ?", userID, monday, friday, models.SummaryTypeDaily).Order("log_date ASC").Find(&dailySummaries)

		if len(dailySummaries) == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "No summaries found for this week"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"weekly_summary":  nil,
			"daily_summaries": dailySummaries,
			"week_start":      monday.Format("2006-01-02"),
			"week_end":        friday.Format("2006-01-02"),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"weekly_summary": summary,
		"week_start":     monday.Format("2006-01-02"),
		"week_end":       friday.Format("2006-01-02"),
	})
}
