package services

import (
	"time"

	"github.com/google/uuid"
	"github.com/stashlog/backend/db"
	"github.com/stashlog/backend/models"
)

type StreakService struct{}

func NewStreakService() *StreakService {
	return &StreakService{}
}

func (s *StreakService) GetStreak(userID uuid.UUID, timezone string) map[string]interface{} {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		loc = time.FixedZone("IST", 5*60*60+30*60)
	}
	localTime := time.Now().In(loc)
	today := time.Date(localTime.Year(), localTime.Month(), localTime.Day(), 0, 0, 0, 0, loc)

	// Calculate streak (weekdays only)
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
		db.DB.Model(&models.Log{}).Where("user_id = ? AND log_date = ?", userID, today).Count(&count)
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

		var count int64
		db.DB.Model(&models.Log{}).Where("user_id = ? AND log_date = ?", userID, current).Count(&count)

		if count == 0 {
			break
		}

		streak++
		current = current.AddDate(0, 0, -1)
	}

	// Get week status (Mon-Fri)
	weekday := int(today.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	monday := today.AddDate(0, 0, -(weekday - 1))

	weekStatus := make([]map[string]interface{}, 0)
	for i := 0; i < 5; i++ {
		day := monday.AddDate(0, 0, i)
		var count int64
		db.DB.Model(&models.Log{}).Where("user_id = ? AND log_date = ?", userID, day).Count(&count)
		weekStatus = append(weekStatus, map[string]interface{}{
			"date":   day.Format("2006-01-02"),
			"day":    day.Weekday().String()[:3],
			"logged": count > 0,
		})
	}

	// Best streak ever
	bestStreak := s.getBestStreak(userID, timezone)

	return map[string]interface{}{
		"current_streak": streak,
		"best_streak":    bestStreak,
		"week_status":    weekStatus,
	}
}

func (s *StreakService) getBestStreak(userID uuid.UUID, timezone string) int {
	var logs []models.Log
	db.DB.Where("user_id = ?", userID).Order("log_date ASC").Select("DISTINCT log_date").Find(&logs)

	if len(logs) == 0 {
		return 0
	}

	bestStreak := 1
	currentStreak := 1

	for i := 1; i < len(logs); i++ {
		prevDate := logs[i-1].LogDate
		currDate := logs[i].LogDate

		// Skip to next weekday
		expected := nextWeekday(prevDate)

		if currDate.Equal(expected) || currDate.Before(expected.AddDate(0, 0, 1)) {
			currentStreak++
		} else {
			currentStreak = 1
		}

		if currentStreak > bestStreak {
			bestStreak = currentStreak
		}
	}

	return bestStreak
}

func nextWeekday(t time.Time) time.Time {
	next := t.AddDate(0, 0, 1)
	for next.Weekday() == time.Saturday || next.Weekday() == time.Sunday {
		next = next.AddDate(0, 0, 1)
	}
	return next
}
