package main

import (
	"fmt"
	"log"
	"time"
	_ "time/tzdata"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/lib/pq"
	"github.com/stashlog/backend/config"
	"github.com/stashlog/backend/db"
	"github.com/stashlog/backend/models"
	"github.com/stashlog/backend/utils"
)

func main() {
	// Load env
	godotenv.Load("../../.env") // load from backend directory
	godotenv.Load()

	cfg := config.Load()
	db.Connect(cfg)

	fmt.Println("Seeding database...")

	// 1. Create Alice
	aliceEmail := "alice@example.com"
	var existingAlice models.User
	if err := db.DB.Where("email = ?", aliceEmail).First(&existingAlice).Error; err == nil {
		fmt.Printf("Alice already exists. Skipping user creation.\n")
	} else {
		hashedAlice, _ := utils.HashPassword("Password123!")
		alice := models.User{
			ID:                 uuid.New(),
			Name:               "Alice Developer",
			Email:              aliceEmail,
			PasswordHash:       hashedAlice,
			AuthProvider:       models.AuthProviderEmail,
			Timezone:           "Asia/Kolkata",
			EmailVerified:      true,
			IsPasswordSet:      true,
			DailyEmailEnabled:  true,
			WeeklyEmailEnabled: true,
			NudgeEmailEnabled:  true,
			CreatedAt:          time.Now().AddDate(0, 0, -10),
		}
		if err := db.DB.Create(&alice).Error; err != nil {
			log.Fatalf("Failed to create Alice: %v", err)
		}
		fmt.Println("Created Alice!")
	}

	db.DB.Where("email = ?", aliceEmail).First(&existingAlice)

	// 2. Create Bob
	bobEmail := "bob@example.com"
	var existingBob models.User
	if err := db.DB.Where("email = ?", bobEmail).First(&existingBob).Error; err == nil {
		fmt.Printf("Bob already exists. Skipping user creation.\n")
	} else {
		hashedBob, _ := utils.HashPassword("Password123!")
		bob := models.User{
			ID:                 uuid.New(),
			Name:               "Bob Coder",
			Email:              bobEmail,
			PasswordHash:       hashedBob,
			AuthProvider:       models.AuthProviderEmail,
			Timezone:           "America/New_York",
			EmailVerified:      true,
			IsPasswordSet:      true,
			DailyEmailEnabled:  true,
			WeeklyEmailEnabled: true,
			NudgeEmailEnabled:  true,
			CreatedAt:          time.Now().AddDate(0, 0, -10),
		}
		if err := db.DB.Create(&bob).Error; err != nil {
			log.Fatalf("Failed to create Bob: %v", err)
		}
		fmt.Println("Created Bob!")
	}

	db.DB.Where("email = ?", bobEmail).First(&existingBob)

	// Clear existing logs and summaries for these seeded users to prevent duplicate key errors
	db.DB.Where("user_id = ? OR user_id = ?", existingAlice.ID, existingBob.ID).Delete(&models.Log{})
	db.DB.Where("user_id = ? OR user_id = ?", existingAlice.ID, existingBob.ID).Delete(&models.Summary{})

	// Seed logs for Alice (Monday June 8 to Friday June 12)
	aliceLogs := []struct {
		Date    string
		Tag     string
		Content string
	}{
		// Monday June 8
		{"2026-06-08", "feature", "Worked on the dashboard UI integration and components layout."},
		{"2026-06-08", "bug", "Fixed navbar alignment issues on smaller mobile viewports."},
		{"2026-06-08", "review", "Reviewed pull request #45 for the new calendar view component layout."},
		// Tuesday June 9
		{"2026-06-09", "bug", "Fixed a styling issue on the sidebar in dark mode."},
		{"2026-06-09", "feature", "Added a color-coded legend to the calendar widget."},
		{"2026-06-09", "learning", "Researched responsive typography and fluid spacing techniques for UI."},
		// Wednesday June 10
		{"2026-06-10", "review", "Reviewed pull request #12 and left comments on database query optimization design patterns."},
		{"2026-06-10", "feature", "Implemented mobile slide-out panel for log creation screen."},
		{"2026-06-10", "bug", "Patched responsive touch target spacing for smaller dashboard action buttons."},
		// Thursday June 11
		{"2026-06-11", "blocked", "Blocked by the backend API deploy status. Waiting for PR review approval."},
		{"2026-06-11", "learning", "Read about SVG optimization tools and icon sprite techniques."},
		{"2026-06-11", "feature", "Designed a new dashboard card component for displaying user streaks."},
		// Friday June 12
		{"2026-06-12", "learning", "Learned GORM hooks and relational queries in Go."},
		{"2026-06-12", "bug", "Resolved state synchronization bug between Zustand store and localStorage."},
		{"2026-06-12", "review", "Reviewed PR for the JWT authentication middleware refactor."},
	}

	for _, al := range aliceLogs {
		logDate, _ := time.Parse("2006-01-02", al.Date)
		logEntry := models.Log{
			ID:        uuid.New(),
			UserID:    existingAlice.ID,
			Content:   al.Content,
			Tags:      pq.StringArray{al.Tag},
			LogDate:   logDate,
			CreatedAt: logDate.Add(15 * time.Hour), // saved around 3 PM
		}
		db.DB.Create(&logEntry)
	}
	fmt.Println("Seeded Alice's logs!")

	// Seed logs for Bob (Monday June 8 to Friday June 12)
	bobLogs := []struct {
		Date    string
		Tag     string
		Content string
	}{
		// Monday June 8
		{"2026-06-08", "feature", "Setup project directory structure and initialized standard Go Gin endpoints."},
		{"2026-06-08", "learning", "Reviewed golang-migrate documentation for schema version tracking."},
		// Tuesday June 9
		{"2026-06-09", "bug", "Fixed database reconnection leak during backend initialization process."},
		{"2026-06-09", "feature", "Added health check endpoints and mapped path to /health."},
		// Wednesday June 10
		{"2026-06-10", "feature", "Designed DB migrations using golang-migrate."},
		{"2026-06-10", "review", "Reviewed backend controller patterns and proposed router grouping."},
		{"2026-06-10", "bug", "Fixed cross-origin resource sharing (CORS) header configuration for local frontend."},
		// Thursday June 11
		{"2026-06-11", "bug", "Resolved memory leak in context middleware."},
		{"2026-06-11", "feature", "Integrated Brevo REST API service client and implemented structured mail templates."},
		{"2026-06-11", "blocked", "Blocked by Gemini API rate limits during verification tests."},
		// Friday June 12
		{"2026-06-12", "review", "Approved PRs for next deployment."},
		{"2026-06-12", "feature", "Configured docker-compose environment with PostgreSQL 16 image and health checks."},
		{"2026-06-12", "learning", "Investigated background task processing using Go channels and select constructs."},
	}

	for _, bl := range bobLogs {
		logDate, _ := time.Parse("2006-01-02", bl.Date)
		logEntry := models.Log{
			ID:        uuid.New(),
			UserID:    existingBob.ID,
			Content:   bl.Content,
			Tags:      pq.StringArray{bl.Tag},
			LogDate:   logDate,
			CreatedAt: logDate.Add(17 * time.Hour), // saved around 5 PM
		}
		db.DB.Create(&logEntry)
	}
	fmt.Println("Seeded Bob's logs!")

	// Seed daily summaries for Alice (grouped by date)
	aliceLogsByDate := make(map[string][]struct{ Tag, Content string })
	for _, al := range aliceLogs {
		aliceLogsByDate[al.Date] = append(aliceLogsByDate[al.Date], struct{ Tag, Content string }{al.Tag, al.Content})
	}

	for dateStr, logs := range aliceLogsByDate {
		logDate, _ := time.Parse("2006-01-02", dateStr)
		rawLogsStr := fmt.Sprintf("User had %d log entries today:\n", len(logs))
		whatIDid := ""
		blockers := ""
		for _, lg := range logs {
			rawLogsStr += fmt.Sprintf("[%s] %s\n", lg.Tag, lg.Content)
			if lg.Tag == "blocked" {
				blockers += fmt.Sprintf("- %s\n", lg.Content)
			} else {
				whatIDid += fmt.Sprintf("- [%s] %s\n", lg.Tag, lg.Content)
			}
		}
		if blockers == "" {
			blockers = "- None\n"
		}
		if whatIDid == "" {
			whatIDid = "- None\n"
		}

		genSummary := fmt.Sprintf("### What I did\n%s\n### Blockers\n%s\n### Plan\n- Continue scheduled UI development.", whatIDid, blockers)

		sum := models.Summary{
			ID:               uuid.New(),
			UserID:           existingAlice.ID,
			LogDate:          logDate,
			SummaryType:      models.SummaryTypeDaily,
			RawLogs:          rawLogsStr,
			GeneratedSummary: genSummary,
			IsFallback:       false,
			GeneratedAt:      logDate.Add(25 * time.Hour),
		}
		db.DB.Create(&sum)
	}

	// Seed daily summaries for Bob (grouped by date)
	bobLogsByDate := make(map[string][]struct{ Tag, Content string })
	for _, bl := range bobLogs {
		bobLogsByDate[bl.Date] = append(bobLogsByDate[bl.Date], struct{ Tag, Content string }{bl.Tag, bl.Content})
	}

	for dateStr, logs := range bobLogsByDate {
		logDate, _ := time.Parse("2006-01-02", dateStr)
		rawLogsStr := fmt.Sprintf("User had %d log entries today:\n", len(logs))
		whatIDid := ""
		blockers := ""
		for _, lg := range logs {
			rawLogsStr += fmt.Sprintf("[%s] %s\n", lg.Tag, lg.Content)
			if lg.Tag == "blocked" {
				blockers += fmt.Sprintf("- %s\n", lg.Content)
			} else {
				whatIDid += fmt.Sprintf("- [%s] %s\n", lg.Tag, lg.Content)
			}
		}
		if blockers == "" {
			blockers = "- None\n"
		}
		if whatIDid == "" {
			whatIDid = "- None\n"
		}

		genSummary := fmt.Sprintf("### What I did\n%s\n### Blockers\n%s\n### Plan\n- Proceed with backend sprint roadmap items.", whatIDid, blockers)

		sum := models.Summary{
			ID:               uuid.New(),
			UserID:           existingBob.ID,
			LogDate:          logDate,
			SummaryType:      models.SummaryTypeDaily,
			RawLogs:          rawLogsStr,
			GeneratedSummary: genSummary,
			IsFallback:       false,
			GeneratedAt:      logDate.Add(25 * time.Hour),
		}
		db.DB.Create(&sum)
	}
	fmt.Println("Seeded daily summaries!")

	// Seed weekly summaries for both (week starting Monday June 8)
	mondayDate, _ := time.Parse("2006-01-02", "2026-06-08")

	aliceWeekly := models.Summary{
		ID:          uuid.New(),
		UserID:      existingAlice.ID,
		LogDate:     mondayDate,
		SummaryType: models.SummaryTypeWeekly,
		RawLogs:     "Mon-Fri daily summaries merged",
		GeneratedSummary: `### Weekly Review
- **Features built**: Completed Dashboard UI layout integration, added responsive color-coded calendar legends, designed user streak card components, and implemented mobile slide-out panels.
- **Bugs fixed**: Solved sidebar dark mode styling, fixed mobile viewport navbar alignment, and adjusted touch target dimensions for action buttons.
- **Reviews done**: Conducted review code feedback for PR #45 (Calendar Component) and PR #12 (DB queries).
- **Key learning**: Researched responsive layouts, responsive typography design systems, SVG optimization, and GORM database transactional hooks.`,
		IsFallback:  false,
		GeneratedAt: mondayDate.Add(4 * 24 * time.Hour).Add(23 * time.Hour), // Friday 11 PM
	}
	db.DB.Create(&aliceWeekly)

	bobWeekly := models.Summary{
		ID:          uuid.New(),
		UserID:      existingBob.ID,
		LogDate:     mondayDate,
		SummaryType: models.SummaryTypeWeekly,
		RawLogs:     "Mon-Fri daily summaries merged",
		GeneratedSummary: `### Weekly Review
- **Features built**: Initialized Gin API framework endpoints, implemented database health check checks, drafted golang-migrate sql queries, integrated Brevo email templates, and defined docker postgres profiles.
- **Bugs fixed**: Cleaned up database client reconnection leak and resolved context middleware memory leak.
- **Reviews done**: Examined API routers patterns and validated deployment readiness.
- **Key learning**: Explored golang-migrate integration, Go channels and select block processing paradigms.`,
		IsFallback:  false,
		GeneratedAt: mondayDate.Add(4 * 24 * time.Hour).Add(23 * time.Hour), // Friday 11 PM
	}
	db.DB.Create(&bobWeekly)
	fmt.Println("Seeded weekly summaries!")

	fmt.Println("Seeding complete successfully! Use Alice: alice@example.com / Password123! or Bob: bob@example.com / Password123!")
}

