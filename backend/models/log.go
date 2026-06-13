package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Log struct {
	ID                     uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID                 uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	Content                string         `gorm:"type:text;not null" json:"content"`
	Tags                   pq.StringArray `gorm:"type:text[];default:'{}'" json:"tags"`
	LogDate                time.Time      `gorm:"type:date;not null" json:"log_date"`
	IsEditedAfterGeneration bool          `gorm:"not null;default:false" json:"is_edited_after_generation"`
	CreatedAt              time.Time      `gorm:"type:timestamptz;not null;default:NOW()" json:"created_at"`
	UpdatedAt              time.Time      `gorm:"type:timestamptz;not null;default:NOW()" json:"updated_at"`
}

func (Log) TableName() string {
	return "logs"
}

type CreateLogRequest struct {
	Content string `json:"content" binding:"required"`
	Tag     string `json:"tag" binding:"required"`
	LogDate string `json:"log_date" binding:"required"`
}

type UpdateLogRequest struct {
	Content string   `json:"content" binding:"omitempty,min=1,max=10000"`
	Tags    []string `json:"tags"`
}

type LogsQuery struct {
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
}
