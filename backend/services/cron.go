package services

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/robfig/cron/v3"
	"github.com/stashlog/backend/config"
	"github.com/stashlog/backend/db"
	"github.com/stashlog/backend/models"
)

type CronService struct {
	cfg           *config.Config
	geminiService *GeminiService
	emailService  *EmailService
	cronRunner    *cron.Cron
}

func NewCronService(cfg *config.Config, geminiService *GeminiService, emailService *EmailService) *CronService {
	return &CronService{
		cfg:           cfg,
		geminiService: geminiService,
		emailService:  emailService,
		cronRunner:    cron.New(cron.WithSeconds()),
	}
}

func (s *CronService) Start() {
	// Run every 30 minutes to check users in different timezones
	s.cronRunner.AddFunc("0 */30 * * * *", func() {
		s.processAllUsers()
	})

	s.cronRunner.Start()
	log.Println("Cron service started")
}

func (s *CronService) Stop() {
	s.cronRunner.Stop()
	log.Println("Cron service stopped")
}

func (s *CronService) processAllUsers() {
	var users []models.User
	db.DB.Where("deleted_at IS NULL AND email_verified = true").Find(&users)

	for i, user := range users {
		// Stagger across users (100ms per user)
		time.Sleep(time.Duration(i*100) * time.Millisecond)

		go s.processUser(user)
	}
}

func (s *CronService) processUser(user models.User) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Panic in processUser for %s: %v", user.Email, r)
		}
	}()

	localTime := getUserLocalTime(user.Timezone)
	hour := localTime.Hour()
	minute := localTime.Minute()
	weekday := localTime.Weekday()

	// Skip weekend processing for weekday-only jobs (daily standup emails and nudges)
	isWeekday := weekday >= time.Monday && weekday <= time.Friday

	// 1 AM Tue-Sat: Generate daily summary (for Mon-Fri logs)
	isTueToSat := weekday >= time.Tuesday && weekday <= time.Saturday
	if isTueToSat && hour == 1 && minute < 30 {
		s.generateDailySummary(user)
	}

	// 8 AM Mon-Fri: Send daily standup email
	if isWeekday && hour == 8 && minute < 30 {
		s.sendDailyEmail(user, weekday)
	}

	// 8 PM Mon-Fri: Send nudge if no log
	if isWeekday && hour == 20 && minute < 30 {
		s.sendNudgeEmail(user)
	}

	// Saturday 10 AM: Generate weekly summary and send weekly digest email
	if weekday == time.Saturday && hour == 10 && minute < 30 {
		s.generateWeeklySummary(user)
		s.sendWeeklyDigestEmail(user)
	}
}

func (s *CronService) generateDailySummary(user models.User) {
	localTime := getUserLocalTime(user.Timezone)
	// Generate summary for yesterday's logs
	yesterday := time.Date(localTime.Year(), localTime.Month(), localTime.Day()-1, 0, 0, 0, 0, localTime.Location())
	yesterdayUTC := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, time.UTC)

	// Check if summary already exists
	var existing models.Summary
	if err := db.DB.Where("user_id = ? AND log_date = ? AND summary_type = ?", user.ID, yesterdayUTC, models.SummaryTypeDaily).First(&existing).Error; err == nil {
		return // Already generated
	}

	// Get all logs for yesterday
	var logs []models.Log
	db.DB.Where("user_id = ? AND log_date = ?", user.ID, yesterdayUTC).Find(&logs)

	if len(logs) == 0 {
		return // No logs to summarize
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

	generatedSummary, isFallback := s.geminiService.GenerateDailySummary(rawLogs)

	summary := models.Summary{
		UserID:           user.ID,
		LogDate:          yesterdayUTC,
		SummaryType:      models.SummaryTypeDaily,
		RawLogs:          rawLogs,
		GeneratedSummary: generatedSummary,
		IsFallback:       isFallback,
		GeneratedAt:      time.Now(),
	}

	db.DB.Create(&summary)
	log.Printf("Generated daily summary for %s (date: %s)", user.Email, yesterdayUTC.Format("2006-01-02"))
}

func (s *CronService) sendDailyEmail(user models.User, weekday time.Weekday) {
	if !user.DailyEmailEnabled {
		return
	}

	localTime := getUserLocalTime(user.Timezone)
	startOfDayLocal := time.Date(localTime.Year(), localTime.Month(), localTime.Day(), 0, 0, 0, 0, localTime.Location())
	endOfDayLocal := startOfDayLocal.AddDate(0, 0, 1)

	// Check if daily standup email was already successfully sent today
	var sentCount int64
	db.DB.Model(&models.EmailLog{}).Where(
		"user_id = ? AND email_type IN ? AND status = ? AND sent_at >= ? AND sent_at < ?",
		user.ID,
		[]models.EmailType{models.EmailTypeDaily, models.EmailTypeMonday},
		models.EmailStatusSent,
		startOfDayLocal,
		endOfDayLocal,
	).Count(&sentCount)

	if sentCount > 0 {
		log.Printf("Daily standup email already sent today for %s, skipping", user.Email)
		return
	}

	isMonday := weekday == time.Monday

	var summaryDate time.Time
	if isMonday {
		// Monday email shows Friday's summary
		summaryDate = time.Date(localTime.Year(), localTime.Month(), localTime.Day()-3, 0, 0, 0, 0, localTime.Location())
	} else {
		// Other days show yesterday's summary
		summaryDate = time.Date(localTime.Year(), localTime.Month(), localTime.Day()-1, 0, 0, 0, 0, localTime.Location())
	}
	summaryDateUTC := time.Date(summaryDate.Year(), summaryDate.Month(), summaryDate.Day(), 0, 0, 0, 0, time.UTC)

	var summary models.Summary
	if err := db.DB.Where("user_id = ? AND log_date = ? AND summary_type = ?", user.ID, summaryDateUTC, models.SummaryTypeDaily).First(&summary).Error; err != nil {
		log.Printf("No summary found for %s on %s", user.Email, summaryDateUTC.Format("2006-01-02"))
		return
	}

	s.emailService.SendDailyStandupEmail(
		user.ID,
		user.Email,
		user.Name,
		summary.GeneratedSummary,
		summaryDate.Format("Monday, January 2"),
		isMonday,
	)
}

func (s *CronService) sendNudgeEmail(user models.User) {
	if !user.NudgeEmailEnabled {
		return
	}

	localTime := getUserLocalTime(user.Timezone)
	startOfDayLocal := time.Date(localTime.Year(), localTime.Month(), localTime.Day(), 0, 0, 0, 0, localTime.Location())
	endOfDayLocal := startOfDayLocal.AddDate(0, 0, 1)

	// Check if nudge email was already successfully sent today
	var sentCount int64
	db.DB.Model(&models.EmailLog{}).Where(
		"user_id = ? AND email_type = ? AND status = ? AND sent_at >= ? AND sent_at < ?",
		user.ID,
		models.EmailTypeNudge,
		models.EmailStatusSent,
		startOfDayLocal,
		endOfDayLocal,
	).Count(&sentCount)

	if sentCount > 0 {
		log.Printf("Nudge email already sent today for %s, skipping", user.Email)
		return
	}
	today := time.Date(localTime.Year(), localTime.Month(), localTime.Day(), 0, 0, 0, 0, localTime.Location())
	todayUTC := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, time.UTC)

	// Check if user has logged anything today
	var count int64
	db.DB.Model(&models.Log{}).Where("user_id = ? AND log_date = ?", user.ID, todayUTC).Count(&count)

	if count > 0 {
		return // Already logged today
	}

	// Get streak
	streak := calculateStreak(user.ID, user.Timezone)

	s.emailService.SendNudgeEmail(user.ID, user.Email, user.Name, streak)
}

func (s *CronService) generateWeeklySummary(user models.User) {
	// Skip if user registered less than 3 days ago (72 hours)
	if time.Since(user.CreatedAt).Hours() < 72 {
		return
	}

	localTime := getUserLocalTime(user.Timezone)
	weekday := localTime.Weekday()
	if weekday == time.Sunday {
		return
	}

	// Get Monday of this week
	daysFromMonday := int(weekday - time.Monday)
	if daysFromMonday < 0 {
		daysFromMonday += 7
	}
	monday := time.Date(localTime.Year(), localTime.Month(), localTime.Day()-daysFromMonday, 0, 0, 0, 0, localTime.Location())
	friday := monday.AddDate(0, 0, 4)

	mondayUTC := time.Date(monday.Year(), monday.Month(), monday.Day(), 0, 0, 0, 0, time.UTC)
	fridayUTC := time.Date(friday.Year(), friday.Month(), friday.Day(), 0, 0, 0, 0, time.UTC)

	// Check if user has zero logs that entire week
	var logCount int64
	db.DB.Model(&models.Log{}).Where("user_id = ? AND log_date >= ? AND log_date <= ?", user.ID, mondayUTC, fridayUTC).Count(&logCount)
	if logCount == 0 {
		log.Printf("Skip weekly summary generation for %s (no logs this week)", user.Email)
		return
	}

	// Check if already exists
	var existing models.Summary
	if err := db.DB.Where("user_id = ? AND log_date = ? AND summary_type = ?", user.ID, mondayUTC, models.SummaryTypeWeekly).First(&existing).Error; err == nil {
		return // Already generated
	}

	// Get all daily summaries for Mon–Fri of that week
	var dailySummaries []models.Summary
	db.DB.Where("user_id = ? AND log_date >= ? AND log_date <= ? AND summary_type = ?",
		user.ID, mondayUTC, fridayUTC, models.SummaryTypeDaily).Order("log_date ASC").Find(&dailySummaries)

	// Merge all daily summaries into one string
	mergedSummaries := ""
	for _, ds := range dailySummaries {
		mergedSummaries += fmt.Sprintf("### %s\n%s\n\n", ds.LogDate.Format("Monday"), ds.GeneratedSummary)
	}

	var weeklySummary string
	var isFallback bool

	// If no daily summaries were generated but logs exist
	if len(dailySummaries) == 0 && logCount > 0 {
		var logs []models.Log
		db.DB.Where("user_id = ? AND log_date >= ? AND log_date <= ?", user.ID, mondayUTC, fridayUTC).Order("log_date ASC").Find(&logs)
		for _, l := range logs {
			mergedSummaries += fmt.Sprintf("- [%s] %s\n", l.LogDate.Format("2006-01-02"), l.Content)
		}
	}

	weeklySummary, isFallback = s.geminiService.GenerateWeeklySummary(mergedSummaries)

	// If Gemini fails all retries (indicated by isFallback=true) or return value is fallback
	if isFallback {
		// Use bullet list of raw daily logs
		var dailyLogs []models.Log
		db.DB.Where("user_id = ? AND log_date >= ? AND log_date <= ?", user.ID, mondayUTC, fridayUTC).Order("log_date ASC, created_at ASC").Find(&dailyLogs)
		fallbackContent := "## Weekly Recap (Fallback)\n\n"
		for _, l := range dailyLogs {
			tagPrefix := ""
			if len(l.Tags) > 0 {
				tagPrefix = "[" + l.Tags[0] + "] "
			}
			fallbackContent += fmt.Sprintf("- [%s] %s%s\n", l.LogDate.Format("2006-01-02"), tagPrefix, l.Content)
		}
		weeklySummary = fallbackContent
	}

	weekSummary := models.Summary{
		UserID:           user.ID,
		LogDate:          mondayUTC,
		SummaryType:      models.SummaryTypeWeekly,
		RawLogs:          mergedSummaries,
		GeneratedSummary: weeklySummary,
		IsFallback:       isFallback,
		GeneratedAt:      time.Now(),
	}

	db.DB.Create(&weekSummary)
	log.Printf("Generated weekly summary for %s (week starting: %s, fallback: %t)", user.Email, mondayUTC.Format("2006-01-02"), isFallback)
}

func (s *CronService) sendWeeklyDigestEmail(user models.User) {
	// If user has weekly_email_enabled = false → skip
	if !user.WeeklyEmailEnabled {
		return
	}

	localTime := getUserLocalTime(user.Timezone)
	startOfDayLocal := time.Date(localTime.Year(), localTime.Month(), localTime.Day(), 0, 0, 0, 0, localTime.Location())
	endOfDayLocal := startOfDayLocal.AddDate(0, 0, 1)

	// Check if weekly digest was already successfully sent today
	var sentCount int64
	db.DB.Model(&models.EmailLog{}).Where(
		"user_id = ? AND email_type = ? AND status = ? AND sent_at >= ? AND sent_at < ?",
		user.ID,
		models.EmailTypeWeekly,
		models.EmailStatusSent,
		startOfDayLocal,
		endOfDayLocal,
	).Count(&sentCount)

	if sentCount > 0 {
		log.Printf("Weekly digest email already sent today for %s, skipping", user.Email)
		return
	}
	weekday := localTime.Weekday()

	// Get Monday of this week
	daysFromMonday := int(weekday - time.Monday)
	if daysFromMonday < 0 {
		daysFromMonday += 7
	}
	monday := time.Date(localTime.Year(), localTime.Month(), localTime.Day()-daysFromMonday, 0, 0, 0, 0, localTime.Location())
	friday := monday.AddDate(0, 0, 4)

	mondayUTC := time.Date(monday.Year(), monday.Month(), monday.Day(), 0, 0, 0, 0, time.UTC)
	fridayUTC := time.Date(friday.Year(), friday.Month(), friday.Day(), 0, 0, 0, 0, time.UTC)

	// Check if user email bounced
	var bounceCount int64
	db.DB.Model(&models.EmailLog{}).Where("user_id = ? AND status = ?", user.ID, models.EmailStatusBounced).Count(&bounceCount)
	if bounceCount > 0 {
		log.Printf("Skip weekly digest email for %s (email bounced)", user.Email)
		return
	}

	// Check if weekly summary exists for this week
	var weeklySummary models.Summary
	if err := db.DB.Where("user_id = ? AND log_date = ? AND summary_type = ?", user.ID, mondayUTC, models.SummaryTypeWeekly).First(&weeklySummary).Error; err != nil {
		// If no summary → skip, log as 'skipped' in email_logs
		s.logEmailEvent(user.ID, models.EmailTypeWeekly, models.EmailStatusSkipped, "No weekly summary found")
		log.Printf("Skipped weekly digest email for %s (no weekly summary found)", user.Email)
		return
	}

	// Count logged days (distinct days logged)
	var logCount int64
	db.DB.Model(&models.Log{}).Where("user_id = ? AND log_date >= ? AND log_date <= ?", user.ID, mondayUTC, fridayUTC).
		Select("DISTINCT log_date").Count(&logCount)

	streak := calculateStreak(user.ID, user.Timezone)
	weekDates := fmt.Sprintf("%s to %s", monday.Format("Jan 2"), friday.Format("Jan 2, 2006"))

	s.emailService.SendWeeklyDigestEmail(user.ID, user.Email, user.Name, weekDates, weeklySummary.GeneratedSummary, int(logCount), streak)
}

func (s *CronService) logEmailEvent(userID uuid.UUID, emailType models.EmailType, status models.EmailStatus, errMsg string) {
	emailLog := models.EmailLog{
		UserID:       userID,
		EmailType:    emailType,
		Status:       status,
		SentAt:       time.Now(),
		ErrorMessage: errMsg,
	}
	db.DB.Create(&emailLog)
}

func getUserLocalTime(timezone string) time.Time {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		loc = time.FixedZone("IST", 5*60*60+30*60)
	}
	return time.Now().In(loc)
}

func calculateStreak(userID interface{}, timezone string) int {
	localTime := getUserLocalTime(timezone)
	today := time.Date(localTime.Year(), localTime.Month(), localTime.Day(), 0, 0, 0, 0, localTime.Location())
	todayUTC := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, time.UTC)
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
		// Skip weekends going backwards
		for current.Weekday() == time.Saturday || current.Weekday() == time.Sunday {
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

	return streak
}
