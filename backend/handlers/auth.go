package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stashlog/backend/config"
	"github.com/stashlog/backend/db"
	"github.com/stashlog/backend/middleware"
	"github.com/stashlog/backend/models"
	"github.com/stashlog/backend/services"
	"github.com/stashlog/backend/utils"
)

type AuthHandler struct {
	cfg          *config.Config
	emailService *services.EmailService
}

func NewAuthHandler(cfg *config.Config, emailService *services.EmailService) *AuthHandler {
	return &AuthHandler{cfg: cfg, emailService: emailService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if err := utils.ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Clean up soft-deleted account with same email to prevent unique index violation
	var unscopedUser models.User
	if err := db.DB.Unscoped().Where("email = ?", req.Email).First(&unscopedUser).Error; err == nil {
		if unscopedUser.DeletedAt != nil {
			db.DB.Unscoped().Delete(&unscopedUser)
		}
	}

	// Check if user exists (prevent email enumeration — same response)
	var existingUser models.User
	result := db.DB.Where("email = ?", req.Email).First(&existingUser)
	if result.Error == nil {
		// User exists but return same message
		c.JSON(http.StatusOK, gin.H{"message": "If this email is not registered, a verification email has been sent."})
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process registration"})
		return
	}

	user := models.User{
		Name:          utils.SanitizeString(req.Name),
		Email:         req.Email,
		PasswordHash:  hashedPassword,
		AuthProvider:  models.AuthProviderEmail,
		IsPasswordSet: true,
		EmailVerified: false,
	}

	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user"})
		return
	}

	// Generate verification token and send email
	verificationToken, err := utils.GenerateVerificationToken()
	if err == nil {
		tokenHash := utils.HashToken(verificationToken)
		session := models.Session{
			UserID:    user.ID,
			TokenHash: tokenHash,
			ExpiresAt: time.Now().Add(24 * time.Hour),
			DeviceInfo: "email-verification",
		}
		db.DB.Create(&session)

		go h.emailService.SendVerificationEmail(user.Email, user.Name, verificationToken)
	}

	c.JSON(http.StatusOK, gin.H{"message": "If this email is not registered, a verification email has been sent."})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Check if account is soft-deleted to return specific message
	var unscopedUser models.User
	if err := db.DB.Unscoped().Where("email = ?", req.Email).First(&unscopedUser).Error; err == nil {
		if unscopedUser.DeletedAt != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "This account has been deleted", "code": "ACCOUNT_DELETED"})
			return
		}
	}

	var user models.User
	if err := db.DB.Where("email = ? AND deleted_at IS NULL", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if !user.EmailVerified {
		c.JSON(http.StatusForbidden, gin.H{"error": "Please verify your email before logging in", "code": "EMAIL_NOT_VERIFIED"})
		return
	}

	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	h.issueTokens(c, &user)
}

func (h *AuthHandler) GoogleAuth(c *gin.Context) {
	var req models.GoogleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	googleUser, err := h.verifyGoogleToken(req.IDToken)
	if err != nil {
		if h.cfg.MockMode {
			// In mock mode, create a test user
			googleUser = &GoogleUserInfo{
				Sub:           "mock-google-id-" + uuid.New().String()[:8],
				Email:         "test@example.com",
				Name:          "Test User",
				EmailVerified: true,
			}
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google token"})
			return
		}
	}

	// Clean up soft-deleted accounts with same email or google_id to avoid constraint violations
	var unscopedUser models.User
	if err := db.DB.Unscoped().Where("email = ? OR (google_id = ? AND google_id != '')", googleUser.Email, googleUser.Sub).First(&unscopedUser).Error; err == nil {
		if unscopedUser.DeletedAt != nil {
			db.DB.Unscoped().Delete(&unscopedUser)
		}
	}

	var user models.User
	err = db.DB.Where("google_id = ? AND deleted_at IS NULL", googleUser.Sub).First(&user).Error

	if err != nil {
		// Check if email exists with email provider
		err = db.DB.Where("email = ? AND deleted_at IS NULL", googleUser.Email).First(&user).Error
		if err == nil {
			// Link Google to existing email account
			user.GoogleID = googleUser.Sub
			user.AuthProvider = models.AuthProviderBoth
			db.DB.Save(&user)
		} else {
			// New user
			user = models.User{
				Name:          googleUser.Name,
				Email:         googleUser.Email,
				GoogleID:      googleUser.Sub,
				AuthProvider:  models.AuthProviderGoogle,
				EmailVerified: true,
				IsPasswordSet: false,
			}
			if err := db.DB.Create(&user).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user"})
				return
			}
		}
	}

	h.issueTokens(c, &user)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No refresh token"})
		return
	}

	claims, err := utils.ValidateToken(refreshToken, h.cfg.JWTRefreshSecret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	// Verify session exists
	tokenHash := utils.HashToken(refreshToken)
	var session models.Session
	if err := db.DB.Where("token_hash = ? AND user_id = ? AND expires_at > ?", tokenHash, userID, time.Now()).First(&session).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Session expired or invalid"})
		return
	}

	var user models.User
	if err := db.DB.Where("id = ? AND deleted_at IS NULL", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Delete old session
	db.DB.Delete(&session)

	// Issue new tokens
	h.issueTokens(c, &user)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err == nil {
		tokenHash := utils.HashToken(refreshToken)
		db.DB.Where("token_hash = ?", tokenHash).Delete(&models.Session{})
	}

	h.clearRefreshCookie(c)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func (h *AuthHandler) LogoutAll(c *gin.Context) {
	userID := middleware.GetUserID(c)
	db.DB.Where("user_id = ?", userID).Delete(&models.Session{})

	h.clearRefreshCookie(c)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out from all devices"})
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Verification token required"})
		return
	}

	tokenHash := utils.HashToken(token)
	var session models.Session
	if err := db.DB.Where("token_hash = ? AND device_info = ? AND expires_at > ?", tokenHash, "email-verification", time.Now()).First(&session).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired verification token"})
		return
	}

	var user models.User
	if err := db.DB.First(&user, "id = ?", session.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	db.DB.Model(&user).Update("email_verified", true)
	db.DB.Delete(&session)

	go h.emailService.SendWelcomeEmail(user.Email, user.Name)

	c.JSON(http.StatusOK, gin.H{"message": "Email verified successfully"})
}

func (h *AuthHandler) SetPassword(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.SetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if err := utils.ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := db.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process password"})
		return
	}

	updates := map[string]interface{}{
		"password_hash":  hashedPassword,
		"is_password_set": true,
	}

	if user.AuthProvider == models.AuthProviderGoogle {
		updates["auth_provider"] = models.AuthProviderBoth
	}

	// Send welcome email if setting password for the first time (Google onboarding completion)
	if !user.IsPasswordSet {
		go h.emailService.SendWelcomeEmail(user.Email, user.Name)
	}

	db.DB.Model(&user).Updates(updates)

	c.JSON(http.StatusOK, gin.H{"message": "Password set successfully"})
}

func (h *AuthHandler) ResendVerification(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		var body struct {
			Email string `json:"email" binding:"required,email"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email required"})
			return
		}
		email = body.Email
	}

	// Always return success to prevent email enumeration
	defer func() {
		c.JSON(http.StatusOK, gin.H{"message": "If this email is registered and unverified, a verification email has been sent."})
	}()

	var user models.User
	if err := db.DB.Where("email = ? AND email_verified = false AND deleted_at IS NULL", email).First(&user).Error; err != nil {
		return
	}

	verificationToken, err := utils.GenerateVerificationToken()
	if err != nil {
		return
	}

	// Clean up old verification tokens
	db.DB.Where("user_id = ? AND device_info = ?", user.ID, "email-verification").Delete(&models.Session{})

	tokenHash := utils.HashToken(verificationToken)
	session := models.Session{
		UserID:     user.ID,
		TokenHash:  tokenHash,
		ExpiresAt:  time.Now().Add(24 * time.Hour),
		DeviceInfo: "email-verification",
	}
	db.DB.Create(&session)

	go h.emailService.SendVerificationEmail(user.Email, user.Name, verificationToken)
}

// Private helpers

func (h *AuthHandler) issueTokens(c *gin.Context, user *models.User) {
	accessToken, err := utils.GenerateAccessToken(user.ID, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID, h.cfg.JWTRefreshSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	// Clean up old sessions on the same device/User-Agent to prevent duplicates
	deviceInfo := c.GetHeader("User-Agent")
	if deviceInfo != "" {
		db.DB.Where("user_id = ? AND device_info = ?", user.ID, deviceInfo).Delete(&models.Session{})
	}

	// Store refresh token session
	tokenHash := utils.HashToken(refreshToken)
	session := models.Session{
		UserID:     user.ID,
		TokenHash:  tokenHash,
		DeviceInfo: deviceInfo,
		IPAddress:  c.ClientIP(),
		ExpiresAt:  time.Now().Add(7 * 24 * time.Hour),
	}
	db.DB.Create(&session)

	h.setRefreshCookie(c, refreshToken)

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"user":         user.ToResponse(),
	})
}

func (h *AuthHandler) setRefreshCookie(c *gin.Context, token string) {
	secure := c.Request.TLS != nil
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("refresh_token", token, 7*24*60*60, "/", "", secure, true)
}

func (h *AuthHandler) clearRefreshCookie(c *gin.Context) {
	secure := c.Request.TLS != nil
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("refresh_token", "", -1, "/", "", secure, true)
}

type GoogleUserInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	EmailVerified bool   `json:"email_verified"`
}

func (h *AuthHandler) verifyGoogleToken(idToken string) (*GoogleUserInfo, error) {
	resp, err := http.Get(fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", idToken))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid token: status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var tokenInfo struct {
		Sub           string `json:"sub"`
		Email         string `json:"email"`
		Name          string `json:"name"`
		EmailVerified string `json:"email_verified"`
		Aud           string `json:"aud"`
	}

	if err := json.Unmarshal(body, &tokenInfo); err != nil {
		return nil, err
	}

	if tokenInfo.Aud != h.cfg.GoogleClientID {
		return nil, fmt.Errorf("token audience mismatch")
	}

	return &GoogleUserInfo{
		Sub:           tokenInfo.Sub,
		Email:         tokenInfo.Email,
		Name:          tokenInfo.Name,
		EmailVerified: tokenInfo.EmailVerified == "true",
	}, nil
}

// LogAuthEvent logs authentication events for auditing
func LogAuthEvent(userID uuid.UUID, event string) {
	log.Printf("AUTH EVENT: user=%s event=%s", userID, event)
}
