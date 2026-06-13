package utils

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"Too short", "Pas1!", true},
		{"No upper", "password123!", true},
		{"No number", "Password!", true},
		{"No special", "Password123", true},
		{"Valid password", "Password123!", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePassword(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePassword() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestPasswordHashing(t *testing.T) {
	password := "Secret123!"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if !CheckPassword(password, hash) {
		t.Errorf("CheckPassword returned false for correct password")
	}

	if CheckPassword("WrongPassword1!", hash) {
		t.Errorf("CheckPassword returned true for incorrect password")
	}
}

func TestTokenSigningAndValidation(t *testing.T) {
	userID := uuid.New()
	secret := "test-jwt-secret-key-stashlog"

	token, err := GenerateAccessToken(userID, secret)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	claims, err := ValidateToken(token, secret)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	if claims.UserID != userID.String() {
		t.Errorf("Expected user ID %s, got %s", userID.String(), claims.UserID)
	}
}

func TestGetLastFriday(t *testing.T) {
	// A Monday: 2026-06-15
	monday := time.Date(2026, 6, 15, 12, 0, 0, 0, time.UTC)
	lastFriday := GetLastFriday(monday)

	expectedFriday := time.Date(2026, 6, 12, 12, 0, 0, 0, time.UTC)
	if !lastFriday.Equal(expectedFriday) {
		t.Errorf("Expected Friday %v, got %v", expectedFriday, lastFriday)
	}
}
