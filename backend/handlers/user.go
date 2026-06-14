package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stashlog/backend/db"
	"github.com/stashlog/backend/middleware"
	"github.com/stashlog/backend/models"
	"github.com/stashlog/backend/utils"
)

type UserHandler struct{}

func NewUserHandler() *UserHandler {
	return &UserHandler{}
}

func (h *UserHandler) GetMe(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var user models.User
	if err := db.DB.First(&user, "id = ? AND deleted_at IS NULL", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get streak info
	streak := services_getStreak(userID, user.Timezone)

	// Check if user email bounced
	var bounceCount int64
	db.DB.Model(&models.EmailLog{}).Where("user_id = ? AND status = ?", userID, models.EmailStatusBounced).Count(&bounceCount)
	emailBounced := bounceCount > 0

	c.JSON(http.StatusOK, gin.H{
		"user":          user.ToResponse(),
		"streak":        streak,
		"email_bounced": emailBounced,
	})
}

func (h *UserHandler) UpdateMe(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	updates := map[string]interface{}{}

	if req.Name != "" {
		updates["name"] = utils.SanitizeString(req.Name)
	}

	if req.Timezone != "" {
		if !utils.IsValidTimezone(req.Timezone) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid timezone"})
			return
		}
		updates["timezone"] = req.Timezone
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update user"})
			return
		}
	}

	var user models.User
	db.DB.First(&user, "id = ?", userID)

	c.JSON(http.StatusOK, gin.H{"user": user.ToResponse()})
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if err := utils.ValidatePassword(req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := db.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.PasswordHash != "" && !utils.CheckPassword(req.OldPassword, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process password"})
		return
	}

	db.DB.Model(&user).Updates(map[string]interface{}{
		"password_hash":  hashedPassword,
		"is_password_set": true,
		"updated_at":      time.Now(),
	})

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func (h *UserHandler) DeleteMe(c *gin.Context) {
	userID := middleware.GetUserID(c)

	now := time.Now()
	if err := db.DB.Model(&models.User{}).Where("id = ?", userID).Update("deleted_at", now).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not delete account"})
		return
	}

	// Delete all sessions
	db.DB.Where("user_id = ?", userID).Delete(&models.Session{})

	c.JSON(http.StatusOK, gin.H{"message": "Account scheduled for deletion"})
}

func (h *UserHandler) GetSessions(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var activeSessions []models.Session
	db.DB.Where("user_id = ? AND expires_at > ? AND device_info != ?", userID, time.Now(), "email-verification").
		Order("created_at DESC").Find(&activeSessions)

	seen := make(map[string]bool)
	var sessions []models.Session
	for _, sess := range activeSessions {
		if seen[sess.DeviceInfo] {
			db.DB.Delete(&sess)
		} else {
			seen[sess.DeviceInfo] = true
			sessions = append(sessions, sess)
		}
	}

	c.JSON(http.StatusOK, gin.H{"sessions": sessions})
}

func (h *UserHandler) DeleteSession(c *gin.Context) {
	userID := middleware.GetUserID(c)
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	result := db.DB.Where("id = ? AND user_id = ?", sessionID, userID).Delete(&models.Session{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session terminated"})
}

func (h *UserHandler) UpdatePreferences(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.UpdatePreferencesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	updates := map[string]interface{}{}

	if req.DailyEmailEnabled != nil {
		updates["daily_email_enabled"] = *req.DailyEmailEnabled
	}
	if req.WeeklyEmailEnabled != nil {
		updates["weekly_email_enabled"] = *req.WeeklyEmailEnabled
	}
	if req.NudgeEmailEnabled != nil {
		updates["nudge_email_enabled"] = *req.NudgeEmailEnabled
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates)
	}

	var user models.User
	db.DB.First(&user, "id = ?", userID)

	c.JSON(http.StatusOK, gin.H{"user": user.ToResponse()})
}

// Helper to get streak - calls streak service
func services_getStreak(userID uuid.UUID, timezone string) map[string]interface{} {
	today := utils.GetTodayInTimezone(timezone)
	todayUTC := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, time.UTC)

	// Calculate streak (weekdays only)
	streak := 0
	current := today

	// Skip weekends going backwards
	for current.Weekday() == time.Saturday || current.Weekday() == time.Sunday {
		current = current.AddDate(0, 0, -1)
	}

	// If we are on a weekday and the user has not logged anything today yet,
	// start counting the streak from the previous weekday.
	if current.Equal(today) {
		var count int64
		db.DB.Model(&models.Log{}).Where("user_id = ? AND log_date = ?", userID, todayUTC).Count(&count)
		if count == 0 {
			current = current.AddDate(0, 0, -1)
			for current.Weekday() == time.Saturday || current.Weekday() == time.Sunday {
				current = current.AddDate(0, 0, -1)
			}
		}
	}

	for {
		// Skip weekends backward
		for utils.IsWeekend(current) {
			current = current.AddDate(0, 0, -1)
		}

		currentUTC := time.Date(current.Year(), current.Month(), current.Day(), 0, 0, 0, 0, time.UTC)
		var count int64
		db.DB.Model(&models.Log{}).Where("user_id = ? AND log_date = ?", userID, currentUTC).Count(&count)

		if count == 0 {
			break
		}

		streak++
		current = current.AddDate(0, 0, -1)
	}

	// Get this week's log status (Mon-Fri)
	weekday := today.Weekday()
	if weekday == time.Sunday {
		weekday = 7
	}
	monday := today.AddDate(0, 0, -int(weekday-time.Monday))

	weekStatus := make([]map[string]interface{}, 0)
	for i := 0; i < 5; i++ {
		day := monday.AddDate(0, 0, i)
		dayUTC := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, time.UTC)
		var count int64
		db.DB.Model(&models.Log{}).Where("user_id = ? AND log_date = ?", userID, dayUTC).Count(&count)
		weekStatus = append(weekStatus, map[string]interface{}{
			"date":   day.Format("2006-01-02"),
			"day":    day.Weekday().String()[:3],
			"logged": count > 0,
		})
	}

	return map[string]interface{}{
		"current_streak": streak,
		"week_status":    weekStatus,
	}
}
