package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/stashlog/backend/config"
	"github.com/stashlog/backend/handlers"
	"github.com/stashlog/backend/middleware"
	"github.com/stashlog/backend/services"
)

func Setup(router *gin.Engine, cfg *config.Config, geminiService *services.GeminiService, emailService *services.EmailService) {
	// CORS
	router.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == cfg.FrontendURL || origin == "http://localhost:5173" || origin == "http://localhost:3000" {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Max-Age", "86400")
		}
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "stashlog-backend",
		})
	})

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg, emailService)
	logHandler := handlers.NewLogHandler()
	summaryHandler := handlers.NewSummaryHandler(cfg, geminiService)
	userHandler := handlers.NewUserHandler()

	// Auth routes (public, rate limited)
	auth := router.Group("/auth")
	auth.Use(middleware.RateLimitMiddleware(60))
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/google", authHandler.GoogleAuth)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/verify-email", authHandler.VerifyEmail)
		auth.POST("/resend-verification", authHandler.ResendVerification)
	}

	// Auth routes that need authentication
	authProtected := router.Group("/auth")
	authProtected.Use(middleware.AuthMiddleware(cfg))
	{
		authProtected.POST("/logout", authHandler.Logout)
		authProtected.POST("/logout-all", authHandler.LogoutAll)
		authProtected.POST("/set-password", authHandler.SetPassword)
	}

	// Protected routes
	protected := router.Group("")
	protected.Use(middleware.AuthMiddleware(cfg))
	{
		// Logs
		logs := protected.Group("/logs")
		{
			logs.GET("", logHandler.GetLogs)
			logs.POST("", logHandler.CreateLog)
			logs.PUT("/:id", logHandler.UpdateLog)
			logs.DELETE("/:id", logHandler.DeleteLog)
			logs.GET("/today", logHandler.GetTodayLogs)
			logs.GET("/date/:date", logHandler.GetLogsByDate)
		}

		// Summaries
		summaries := protected.Group("/summaries")
		{
			summaries.GET("", summaryHandler.GetSummaries)
			summaries.GET("/date/:date", summaryHandler.GetSummaryByDate)
			summaries.POST("/regenerate/:date", summaryHandler.RegenerateSummary)
			summaries.GET("/weekly/:week", summaryHandler.GetWeeklySummary)
		}

		// Users
		users := protected.Group("/users")
		{
			users.GET("/me", userHandler.GetMe)
			users.PUT("/me", userHandler.UpdateMe)
			users.PUT("/me/password", userHandler.ChangePassword)
			users.DELETE("/me", userHandler.DeleteMe)
			users.GET("/me/sessions", userHandler.GetSessions)
			users.DELETE("/me/sessions/:id", userHandler.DeleteSession)
			users.PUT("/me/preferences", userHandler.UpdatePreferences)
		}
	}
}
