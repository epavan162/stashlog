package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/stashlog/backend/db"
	"github.com/stashlog/backend/middleware"
	"github.com/stashlog/backend/models"
	"github.com/stashlog/backend/utils"
)

type LogHandler struct{}

func NewLogHandler() *LogHandler {
	return &LogHandler{}
}

func (h *LogHandler) GetLogs(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var query models.LogsQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters"})
		return
	}

	dbQuery := db.DB.Where("user_id = ?", userID).Order("log_date DESC, created_at DESC")

	if query.StartDate != "" {
		startDate, err := time.Parse("2006-01-02", query.StartDate)
		if err == nil {
			dbQuery = dbQuery.Where("log_date >= ?", startDate)
		}
	}

	if query.EndDate != "" {
		endDate, err := time.Parse("2006-01-02", query.EndDate)
		if err == nil {
			dbQuery = dbQuery.Where("log_date <= ?", endDate)
		}
	}

	var logs []models.Log
	if err := dbQuery.Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}

func (h *LogHandler) CreateLog(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.CreateLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	content := utils.SanitizeString(req.Content)
	if len(content) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Log entry cannot be empty"})
		return
	}

	if req.Tag == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please select a tag before saving"})
		return
	}

	// Fetch user timezone for weekend check
	var user models.User
	if err := db.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	loc, err := time.LoadLocation(user.Timezone)
	if err != nil {
		loc = time.FixedZone("IST", 5*60*60+30*60)
	}
	localTime := time.Now().In(loc)
	weekday := localTime.Weekday()

	logDate, err := time.Parse("2006-01-02", req.LogDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD."})
		return
	}

	if logDate.Weekday() == time.Saturday || logDate.Weekday() == time.Sunday {
		c.JSON(http.StatusForbidden, gin.H{"error": "Logging is not available on weekends"})
		return
	}

	// Truncate time for comparison
	logDateOnly := time.Date(logDate.Year(), logDate.Month(), logDate.Day(), 0, 0, 0, 0, time.UTC)
	todayOnly := time.Date(localTime.Year(), localTime.Month(), localTime.Day(), 0, 0, 0, 0, time.UTC)

	if weekday == time.Saturday || weekday == time.Sunday {
		c.JSON(http.StatusForbidden, gin.H{"error": "Logging is not available on weekends"})
		return
	}

	// Weekdays (Monday to Friday): must log for that day (before midnight)
	if !logDateOnly.Equal(todayOnly) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only submit logs for the current day."})
		return
	}

	logEntry := models.Log{
		UserID:  userID,
		Content: content,
		Tags:    pq.StringArray{req.Tag},
		LogDate: logDate,
	}

	if err := db.DB.Create(&logEntry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create log"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"log": logEntry})
}

func (h *LogHandler) UpdateLog(c *gin.Context) {
	userID := middleware.GetUserID(c)
	logID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid log ID"})
		return
	}

	var logEntry models.Log
	if err := db.DB.Where("id = ? AND user_id = ?", logID, userID).First(&logEntry).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Log not found"})
		return
	}

	// Check if summary has been generated (locked after 12 AM)
	var summary models.Summary
	summaryExists := db.DB.Where("user_id = ? AND log_date = ? AND summary_type = ?", userID, logEntry.LogDate, models.SummaryTypeDaily).First(&summary).Error == nil

	var req models.UpdateLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	updates := map[string]interface{}{}

	if req.Content != "" {
		content := utils.SanitizeString(req.Content)
		if len(content) > 10000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Content exceeds 10,000 character limit"})
			return
		}
		updates["content"] = content
		if summaryExists {
			updates["is_edited_after_generation"] = true
		}
	}

	if req.Tags != nil {
		updates["tags"] = pq.StringArray(req.Tags)
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := db.DB.Model(&logEntry).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update log"})
			return
		}
	}

	db.DB.First(&logEntry, logID)
	c.JSON(http.StatusOK, gin.H{"log": logEntry, "is_locked": summaryExists})
}

func (h *LogHandler) DeleteLog(c *gin.Context) {
	userID := middleware.GetUserID(c)
	logID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid log ID"})
		return
	}

	var logEntry models.Log
	if err := db.DB.Where("id = ? AND user_id = ?", logID, userID).First(&logEntry).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Log not found"})
		return
	}

	// Check if today is past midnight of the log_date
	var user models.User
	if err := db.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	loc, err := time.LoadLocation(user.Timezone)
	if err != nil {
		loc = time.FixedZone("IST", 5*60*60+30*60)
	}
	localTime := time.Now().In(loc)
	today := time.Date(localTime.Year(), localTime.Month(), localTime.Day(), 0, 0, 0, 0, loc)

	logDateInZone := time.Date(logEntry.LogDate.Year(), logEntry.LogDate.Month(), logEntry.LogDate.Day(), 0, 0, 0, 0, loc)

	if today.After(logDateInZone) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Log entries cannot be deleted after midnight"})
		return
	}

	if err := db.DB.Delete(&logEntry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not delete log"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Log deleted successfully"})
}

func (h *LogHandler) GetTodayLogs(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Get user timezone
	var user models.User
	db.DB.First(&user, "id = ?", userID)

	today := utils.GetTodayInTimezone(user.Timezone)
	todayUTC := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, time.UTC)

	var logs []models.Log
	if err := db.DB.Where("user_id = ? AND log_date = ?", userID, todayUTC).Order("created_at DESC").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch logs"})
		return
	}

	// Check if summary exists (locked)
	var summary models.Summary
	isLocked := db.DB.Where("user_id = ? AND log_date = ? AND summary_type = ?", userID, todayUTC, models.SummaryTypeDaily).First(&summary).Error == nil

	c.JSON(http.StatusOK, gin.H{"logs": logs, "date": today.Format("2006-01-02"), "is_locked": isLocked})
}

func (h *LogHandler) GetLogsByDate(c *gin.Context) {
	userID := middleware.GetUserID(c)
	dateStr := c.Param("date")

	logDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD."})
		return
	}

	var logs []models.Log
	if err := db.DB.Where("user_id = ? AND log_date = ?", userID, logDate).Order("created_at DESC").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs, "date": dateStr})
}
