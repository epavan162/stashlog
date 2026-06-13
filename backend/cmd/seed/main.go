package main

import (
	"fmt"
	"log"
	"time"

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
		{"2026-06-08", "feature", "Worked on the dashboard UI integration and components layout."},
		{"2026-06-09", "bug", "Fixed a styling issue on the sidebar in dark mode."},
		{"2026-06-10", "review", "Reviewed pull request #12 and left comments on design patterns."},
		{"2026-06-11", "blocked", "Blocked by the backend API deploy status. Waiting for review."},
		{"2026-06-12", "learning", "Learned GORM hooks and relational queries in Go."},
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

	// Seed logs for Bob (Wednesday June 10 to Friday June 12)
	bobLogs := []struct {
		Date    string
		Tag     string
		Content string
	}{
		{"2026-06-10", "feature", "Designed DB migrations using golang-migrate."},
		{"2026-06-11", "bug", "Resolved memory leak in context middleware."},
		{"2026-06-12", "review", "Approved PRs for next deployment."},
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

	// Seed daily summaries for Alice
	for _, al := range aliceLogs {
		logDate, _ := time.Parse("2006-01-02", al.Date)
		sum := models.Summary{
			ID:               uuid.New(),
			UserID:           existingAlice.ID,
			LogDate:          logDate,
			SummaryType:      models.SummaryTypeDaily,
			RawLogs:          fmt.Sprintf("User had 1 log entries today:\n[%s] %s\n", al.Tag, al.Content),
			GeneratedSummary: fmt.Sprintf("### What I did\n- %s\n\n### Blockers\n- None\n\n### Plan\n- Next tasks in progress.", al.Content),
			IsFallback:       false,
			GeneratedAt:      logDate.Add(25 * time.Hour), // generated next day 1 AM
		}
		db.DB.Create(&sum)
	}

	// Seed daily summaries for Bob
	for _, bl := range bobLogs {
		logDate, _ := time.Parse("2006-01-02", bl.Date)
		sum := models.Summary{
			ID:               uuid.New(),
			UserID:           existingBob.ID,
			LogDate:          logDate,
			SummaryType:      models.SummaryTypeDaily,
			RawLogs:          fmt.Sprintf("User had 1 log entries today:\n[%s] %s\n", bl.Tag, bl.Content),
			GeneratedSummary: fmt.Sprintf("### What I did\n- %s\n\n### Blockers\n- None\n\n### Plan\n- Next sprint setup.", bl.Content),
			IsFallback:       false,
			GeneratedAt:      logDate.Add(25 * time.Hour), // generated next day 1 AM
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
- **Features built**: Completed Dashboard UI and finalized all dynamic layout components.
- **Bugs fixed**: Solved a dark mode visual bug in the sidebar display.
- **Key learning**: Acquired in-depth knowledge about GORM hooks and transaction boundaries.`,
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
- **Features built**: Successfully setup the automated database migrations package.
- **Bugs fixed**: Eliminated middleware context memory leaks.
- **Key review**: Finished reviewing and merging pull requests for Friday release.`,
		IsFallback:  false,
		GeneratedAt: mondayDate.Add(4 * 24 * time.Hour).Add(23 * time.Hour), // Friday 11 PM
	}
	db.DB.Create(&bobWeekly)
	fmt.Println("Seeded weekly summaries!")

	fmt.Println("Seeding complete successfully! Use Alice: alice@example.com / Password123! or Bob: bob@example.com / Password123!")
}
