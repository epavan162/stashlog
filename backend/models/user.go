package models

import (
	"time"

	"github.com/google/uuid"
)

type AuthProvider string

const (
	AuthProviderEmail  AuthProvider = "email"
	AuthProviderGoogle AuthProvider = "google"
	AuthProviderBoth   AuthProvider = "both"
)

type User struct {
	ID                  uuid.UUID    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Name                string       `gorm:"type:varchar(255);not null" json:"name"`
	Email               string       `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash        string       `gorm:"type:varchar(255)" json:"-"`
	GoogleID            string       `gorm:"type:varchar(255)" json:"-"`
	AuthProvider        AuthProvider `gorm:"type:auth_provider;not null;default:'email'" json:"auth_provider"`
	Timezone            string       `gorm:"type:varchar(100);not null;default:'Asia/Kolkata'" json:"timezone"`
	EmailVerified       bool         `gorm:"not null;default:false" json:"email_verified"`
	IsPasswordSet       bool         `gorm:"not null;default:false" json:"is_password_set"`
	DailyEmailEnabled   bool         `gorm:"not null;default:true" json:"daily_email_enabled"`
	WeeklyEmailEnabled  bool         `gorm:"not null;default:true" json:"weekly_email_enabled"`
	NudgeEmailEnabled   bool         `gorm:"not null;default:true" json:"nudge_email_enabled"`
	DeletedAt           *time.Time   `gorm:"type:timestamptz" json:"deleted_at,omitempty"`
	CreatedAt           time.Time    `gorm:"type:timestamptz;not null;default:NOW()" json:"created_at"`
	UpdatedAt           time.Time    `gorm:"type:timestamptz;not null;default:NOW()" json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=255"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=128"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type GoogleAuthRequest struct {
	IDToken string `json:"id_token" binding:"required"`
}

type SetPasswordRequest struct {
	Password string `json:"password" binding:"required,min=8,max=128"`
}

type UpdateUserRequest struct {
	Name     string `json:"name" binding:"omitempty,min=2,max=255"`
	Timezone string `json:"timezone" binding:"omitempty"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8,max=128"`
}

type UpdatePreferencesRequest struct {
	DailyEmailEnabled  *bool `json:"daily_email_enabled"`
	WeeklyEmailEnabled *bool `json:"weekly_email_enabled"`
	NudgeEmailEnabled  *bool `json:"nudge_email_enabled"`
}

type UserResponse struct {
	ID                 uuid.UUID    `json:"id"`
	Name               string       `json:"name"`
	Email              string       `json:"email"`
	AuthProvider       AuthProvider `json:"auth_provider"`
	Timezone           string       `json:"timezone"`
	EmailVerified      bool         `json:"email_verified"`
	IsPasswordSet      bool         `json:"is_password_set"`
	DailyEmailEnabled  bool         `json:"daily_email_enabled"`
	WeeklyEmailEnabled bool         `json:"weekly_email_enabled"`
	NudgeEmailEnabled  bool         `json:"nudge_email_enabled"`
	CreatedAt          time.Time    `json:"created_at"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:                 u.ID,
		Name:               u.Name,
		Email:              u.Email,
		AuthProvider:       u.AuthProvider,
		Timezone:           u.Timezone,
		EmailVerified:      u.EmailVerified,
		IsPasswordSet:      u.IsPasswordSet,
		DailyEmailEnabled:  u.DailyEmailEnabled,
		WeeklyEmailEnabled: u.WeeklyEmailEnabled,
		NudgeEmailEnabled:  u.NudgeEmailEnabled,
		CreatedAt:          u.CreatedAt,
	}
}
