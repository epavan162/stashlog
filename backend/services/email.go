package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/stashlog/backend/config"
	"github.com/stashlog/backend/db"
	"github.com/stashlog/backend/models"
)

type EmailService struct {
	cfg *config.Config
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{cfg: cfg}
}

type brevoEmailRequest struct {
	Sender      brevoContact   `json:"sender"`
	To          []brevoContact `json:"to"`
	Subject     string         `json:"subject"`
	HTMLContent string         `json:"htmlContent"`
}

type brevoContact struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (s *EmailService) SendVerificationEmail(email, name, token string) {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", s.cfg.FrontendURL, token)

	subject := "Verify your Stashlog account"
	html := fmt.Sprintf(`
		<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
			<div style="text-align: center; margin-bottom: 32px;">
				<h1 style="font-size: 28px; color: #c2533c; margin: 0;">Stashlog</h1>
			</div>
			<h2 style="font-size: 22px; color: #1a1814;">Hey %s, verify your email</h2>
			<p style="font-size: 16px; color: #666; line-height: 1.6;">
				Welcome to Stashlog! Click the button below to verify your email address and start logging your work.
			</p>
			<div style="text-align: center; margin: 32px 0;">
				<a href="%s" style="background: #c2533c; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 16px;">
					Verify Email
				</a>
			</div>
			<p style="font-size: 14px; color: #999;">
				This link expires in 24 hours. If you didn't create a Stashlog account, you can safely ignore this email.
			</p>
		</div>
	`, name, verifyURL)

	s.sendEmail(email, name, subject, html, models.EmailTypeVerification, uuid.Nil)
}

func (s *EmailService) SendWelcomeEmail(email, name string) {
	subject := "Welcome to Stashlog! 🚀"

	html := fmt.Sprintf(`
		<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
			<div style="text-align: center; margin-bottom: 32px;">
				<h1 style="font-size: 28px; color: #c2533c; margin: 0; font-family: sans-serif; font-weight: bold;">Stashlog</h1>
			</div>
			
			<h2 style="font-size: 22px; color: #1a1814; margin-bottom: 16px;">Welcome aboard, %s! 🚀</h2>
			<p style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 24px;">
				We're thrilled to have you here! Stashlog is built to help developers seamlessly track their work items and automate their daily standups without hassle. Here is everything you need to know about your features and schedule:
			</p>
			
			<h3 style="font-size: 17px; color: #1a1814; margin-top: 32px; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">📝 Tracking Your Work</h3>
			<ul style="padding-left: 20px; font-size: 14.5px; color: #555; line-height: 1.7; margin: 0 0 24px 0;">
				<li><strong>Log Daily Entries</strong>: Simply write what you worked on and select a single tag: <span style="color: #c2533c; font-weight: bold;">Bug</span>, <span style="color: #c2533c; font-weight: bold;">Feature</span>, <span style="color: #c2533c; font-weight: bold;">Review</span>, <span style="color: #c2533c; font-weight: bold;">Blocked</span>, or <span style="color: #c2533c; font-weight: bold;">Learning</span>.</li>
				<li><strong>Visual History</strong>: View your progress on the interactive Calendar Dashboard with color-coded markers.</li>
			</ul>

			<h3 style="font-size: 17px; color: #1a1814; margin-top: 24px; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">📬 Timezone-Aware Automated Schedules</h3>
			<p style="font-size: 14.5px; color: #555; line-height: 1.6; margin: 0 0 16px 0;">All schedules are automatically calculated using your preferred local timezone (configured in Settings):</p>
			<ul style="padding-left: 20px; font-size: 14.5px; color: #555; line-height: 1.7; margin: 0 0 24px 0;">
				<li><strong>12 AM (AI Summarization)</strong>: Every night, the AI aggregates all your logs from the day into a ready-to-paste standup digest.</li>
				<li><strong>8 AM (Daily Standup Email)</strong>: Sent directly to your inbox every weekday morning. On <strong>Monday</strong> morning, you will receive the standup summary of what you logged on <strong>Friday</strong>. From <strong>Tuesday to Friday</strong>, you will receive the standup update of what you logged the <strong>previous day</strong>.</li>
				<li><strong>8 PM (Smart Nudges)</strong>: If you haven't logged any work for today yet, a nudge reminder is emailed to you so you never lose your streak.</li>
				<li><strong>Saturday 10 AM (Weekly Digest)</strong>: Re-cap your week with a weekly summary, streak tracker, and days logged digest.</li>
			</ul>

			<h3 style="font-size: 17px; color: #1a1814; margin-top: 24px; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">🛋️ Weekend Rest Policy & Deadlines</h3>
			<ul style="padding-left: 20px; font-size: 14.5px; color: #555; line-height: 1.7; margin: 0 0 24px 0;">
				<li><strong>Daily Submission Deadline</strong>: On regular weekdays (Monday to Friday), you must submit your logs before midnight (12:00 AM) in your local timezone, after which the day closes and the AI generates your standup summary at 12:00 AM.</li>
				<li><strong>No Weekend Logging</strong>: Logging is completely blocked on Saturday and Sunday.</li>
				<li><strong>Rest Up</strong>: All day Saturday and Sunday, logging is fully locked so you can rest and recharge!</li>
			</ul>
			
			<div style="text-align: center; margin: 36px 0;">
				<a href="%s/dashboard" style="background-color: #c2533c; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
					Go to Dashboard
				</a>
			</div>
			
			<p style="font-size: 13.5px; color: #999; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
				If you have any questions or feedback, feel free to reply directly to this email. Have a productive week! 🚀
			</p>
		</div>
	`, name, s.cfg.FrontendURL)

	s.sendEmail(email, name, subject, html, models.EmailTypeVerification, uuid.Nil)
}


func (s *EmailService) SendDailyStandupEmail(userID uuid.UUID, email, name, summary, logDate string, isMonday bool) {
	var subject, intro string

	if isMonday {
		subject = fmt.Sprintf("Your Monday standup — here's what you did last Friday")
		intro = fmt.Sprintf("Last Friday (%s), here's what you did. Use this to kick off your Monday standup:", logDate)
	} else {
		var todayWeekday string
		if len(logDate) >= 3 {
			switch logDate[:3] {
			case "Mon":
				todayWeekday = "Tuesday"
			case "Tue":
				todayWeekday = "Wednesday"
			case "Wed":
				todayWeekday = "Thursday"
			case "Thu":
				todayWeekday = "Friday"
			default:
				todayWeekday = "today"
			}
		} else {
			todayWeekday = "today"
		}
		subject = fmt.Sprintf("Your standup for %s — here's what you did yesterday", todayWeekday)
		intro = fmt.Sprintf("Yesterday (%s), here's what you did. Use this in your standup today:", logDate)
	}

	html := fmt.Sprintf(`
		<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
			<div style="text-align: center; margin-bottom: 32px;">
				<h1 style="font-size: 28px; color: #c2533c; margin: 0;">Stashlog</h1>
			</div>
			<h2 style="font-size: 20px; color: #1a1814;">Good morning, %s! ☀️</h2>
			<p style="font-size: 16px; color: #666; line-height: 1.6;">%s</p>
			<div style="background: #f8f7f4; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #c2533c;">
				<div style="font-size: 15px; color: #1a1814; line-height: 1.7; white-space: pre-wrap;">%s</div>
			</div>
			<p style="font-size: 14px; color: #999; text-align: center;">
				Copy-paste this into your standup. Have a great day! 🚀
			</p>
		</div>
	`, name, intro, summary)

	emailType := models.EmailTypeDaily
	if isMonday {
		emailType = models.EmailTypeMonday
	}

	s.sendEmail(email, name, subject, html, emailType, userID)
}

func (s *EmailService) SendWeeklyDigestEmail(userID uuid.UUID, email, name, weekDates, summary string, daysLogged int, streak int) {
	subject := fmt.Sprintf("Your week in review — %s", weekDates)

	html := fmt.Sprintf(`
		<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
			<div style="text-align: center; margin-bottom: 32px;">
				<h1 style="font-size: 28px; color: #c2533c; margin: 0;">Stashlog</h1>
			</div>
			<h2 style="font-size: 20px; color: #1a1814;">Here's what you did this week:</h2>
			<div style="background: #f8f7f4; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #c2533c;">
				<div style="font-size: 15px; color: #1a1814; line-height: 1.7; white-space: pre-wrap;">%s</div>
			</div>
			<div style="display: flex; gap: 16px; margin: 24px 0;">
				<div style="flex: 1; background: #f0ece4; border-radius: 12px; padding: 16px; text-align: center;">
					<div style="font-size: 28px; font-weight: 700; color: #c2533c;">%d / 5</div>
					<div style="font-size: 13px; color: #666;">You logged %d out of 5 days</div>
				</div>
				<div style="flex: 1; background: #f0ece4; border-radius: 12px; padding: 16px; text-align: center;">
					<div style="font-size: 28px; font-weight: 700; color: #d18a2a;">🔥 %d</div>
					<div style="font-size: 13px; color: #666;">Current streak count</div>
				</div>
			</div>
			<p style="font-size: 14px; color: #999; text-align: center;">
				Great work this week! Enjoy your weekend 🎉
			</p>
		</div>
	`, summary, daysLogged, daysLogged, streak)

	s.sendEmail(email, name, subject, html, models.EmailTypeWeekly, userID)
}

func (s *EmailService) SendNudgeEmail(userID uuid.UUID, email, name string, streak int) {
	subject := "Don't forget to log your work today! 🔥"

	streakMsg := ""
	if streak > 0 {
		streakMsg = fmt.Sprintf("You have a %d-day streak going. Don't break it!", streak)
	}

	html := fmt.Sprintf(`
		<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
			<div style="text-align: center; margin-bottom: 32px;">
				<h1 style="font-size: 28px; color: #c2533c; margin: 0;">Stashlog</h1>
			</div>
			<h2 style="font-size: 20px; color: #1a1814;">Hey %s, you haven't logged anything today! 📝</h2>
			<p style="font-size: 16px; color: #666; line-height: 1.6;">
				Take 2 minutes to jot down what you worked on. Your future self will thank you during standup.
				%s
			</p>
			<div style="text-align: center; margin: 32px 0;">
				<a href="%s/dashboard" style="background: #c2533c; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 16px;">
					Log Your Work
				</a>
			</div>
		</div>
	`, name, streakMsg, s.cfg.FrontendURL)

	s.sendEmail(email, name, subject, html, models.EmailTypeNudge, userID)
}

func (s *EmailService) sendEmail(toEmail, toName, subject, html string, emailType models.EmailType, userID uuid.UUID) {
	if s.cfg.MockMode {
		log.Printf("[MOCK EMAIL] To: %s <%s> | Subject: %s | Type: %s", toName, toEmail, subject, emailType)
		if userID != uuid.Nil {
			s.logEmail(userID, emailType, models.EmailStatusSent, "")
		}
		return
	}

	reqBody := brevoEmailRequest{
		Sender:      brevoContact{Name: s.cfg.BrevoSenderName, Email: s.cfg.BrevoSenderEmail},
		To:          []brevoContact{{Name: toName, Email: toEmail}},
		Subject:     subject,
		HTMLContent: html,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		log.Printf("Error marshaling email request: %v", err)
		if userID != uuid.Nil {
			s.logEmail(userID, emailType, models.EmailStatusFailed, err.Error())
		}
		return
	}

	req, err := http.NewRequest("POST", "https://api.brevo.com/v3/smtp/email", bytes.NewBuffer(jsonBody))
	if err != nil {
		log.Printf("Error creating email request: %v", err)
		if userID != uuid.Nil {
			s.logEmail(userID, emailType, models.EmailStatusFailed, err.Error())
		}
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("api-key", s.cfg.BrevoAPIKey)
	req.Header.Set("accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending email: %v", err)
		if userID != uuid.Nil {
			s.logEmail(userID, emailType, models.EmailStatusFailed, err.Error())
		}
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("Email sent successfully to %s: %s", toEmail, subject)
		if userID != uuid.Nil {
			s.logEmail(userID, emailType, models.EmailStatusSent, "")
		}
	} else {
		errMsg := fmt.Sprintf("Brevo API error %d: %s", resp.StatusCode, string(body))
		log.Printf("Error sending email: %s", errMsg)
		if userID != uuid.Nil {
			s.logEmail(userID, emailType, models.EmailStatusFailed, errMsg)
		}
	}
}

func (s *EmailService) logEmail(userID uuid.UUID, emailType models.EmailType, status models.EmailStatus, errMsg string) {
	emailLog := models.EmailLog{
		UserID:       userID,
		EmailType:    emailType,
		Status:       status,
		SentAt:       time.Now(),
		ErrorMessage: errMsg,
	}
	db.DB.Create(&emailLog)
}
