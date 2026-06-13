package db

import (
	"log"
	"path/filepath"
	"runtime"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/stashlog/backend/config"
)

func RunMigrations(cfg *config.Config) {
	migrationsPath := getMigrationsPath()
	sourceURL := "file://" + migrationsPath

	m, err := migrate.New(sourceURL, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Could not create migrate instance: %v", err)
	}
	defer m.Close()

	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Could not run migrations: %v", err)
	}

	if err == migrate.ErrNoChange {
		log.Println("Migrations: no changes to apply")
	} else {
		log.Println("Migrations: applied successfully")
	}

	version, dirty, _ := m.Version()
	log.Printf("Migrations: current version=%d, dirty=%v", version, dirty)
}

func getMigrationsPath() string {
	_, filename, _, _ := runtime.Caller(0)
	dir := filepath.Dir(filename)
	return filepath.Join(dir, "..", "migrations")
}
