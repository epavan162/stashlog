package models

import (
	"time"

	"github.com/google/uuid"
)

type SummaryType string

const (
	SummaryTypeDaily  SummaryType = "daily"
	SummaryTypeWeekly SummaryType = "weekly"
)

type EmailType string

const (
	EmailTypeDaily        EmailType = "daily"
	EmailTypeWeekly       EmailType = "weekly"
	EmailTypeNudge        EmailType = "nudge"
	EmailTypeVerification EmailType = "verification"
	EmailTypeMonday       EmailType = "monday"
)

type EmailStatus string

const (
	EmailStatusSent    EmailStatus = "sent"
	EmailStatusFailed  EmailStatus = "failed"
	EmailStatusSkipped EmailStatus = "skipped"
	EmailStatusBounced EmailStatus = "bounced"
)

type Summary struct {
	ID                uuid.UUID   `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID            uuid.UUID   `gorm:"type:uuid;not null" json:"user_id"`
	LogDate           time.Time   `gorm:"type:date;not null" json:"log_date"`
	SummaryType       SummaryType `gorm:"type:summary_type;not null" json:"summary_type"`
	RawLogs           string      `gorm:"type:text;not null" json:"raw_logs"`
	GeneratedSummary  string      `gorm:"type:text;not null" json:"generated_summary"`
	RegenerationCount int         `gorm:"not null;default:0" json:"regeneration_count"`
	IsFallback        bool        `gorm:"not null;default:false" json:"is_fallback"`
	GeneratedAt       time.Time   `gorm:"type:timestamptz;not null;default:NOW()" json:"generated_at"`
	CreatedAt         time.Time   `gorm:"type:timestamptz;not null;default:NOW()" json:"created_at"`
	UpdatedAt         time.Time   `gorm:"type:timestamptz;not null;default:NOW()" json:"updated_at"`
}

func (Summary) TableName() string {
	return "summaries"
}

type Session struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	TokenHash  string    `gorm:"type:varchar(255);not null" json:"-"`
	DeviceInfo string    `gorm:"type:varchar(500)" json:"device_info"`
	IPAddress  string    `gorm:"type:varchar(100)" json:"ip_address"`
	CreatedAt  time.Time `gorm:"type:timestamptz;not null;default:NOW()" json:"created_at"`
	ExpiresAt  time.Time `gorm:"type:timestamptz;not null" json:"expires_at"`
}

func (Session) TableName() string {
	return "sessions"
}

type EmailLog struct {
	ID           uuid.UUID   `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID       uuid.UUID   `gorm:"type:uuid;not null" json:"user_id"`
	EmailType    EmailType   `gorm:"type:email_type;not null" json:"email_type"`
	Status       EmailStatus `gorm:"type:email_status;not null" json:"status"`
	SentAt       time.Time   `gorm:"type:timestamptz;not null;default:NOW()" json:"sent_at"`
	ErrorMessage string      `gorm:"type:text" json:"error_message,omitempty"`
}

func (EmailLog) TableName() string {
	return "email_logs"
}
