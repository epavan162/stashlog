package db

import (
	"log"
	"time"

	"github.com/stashlog/backend/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) {
	var err error

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	for i := 0; i < 5; i++ {
		DB, err = gorm.Open(postgres.Open(cfg.DatabaseURL), gormConfig)
		if err == nil {
			break
		}
		log.Printf("Failed to connect to database (attempt %d/5): %v", i+1, err)
		time.Sleep(time.Duration(i+1) * 2 * time.Second)
	}

	if err != nil {
		log.Fatalf("Could not connect to database after 5 attempts: %v", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Could not get underlying DB: %v", err)
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	log.Println("Database connected successfully")
}
