# Stashlog

**Your daily work. Remembered. Standup-ready.**

A personal daily work logger for developers with AI-powered standup email summaries.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v3 |
| State | Zustand (auth) + React Query (server state) |
| Backend | Go 1.22 + Gin + GORM |
| Database | PostgreSQL 16 |
| AI | Google Gemini 1.5 Flash |
| Email | Brevo REST API |
| CI/CD | GitHub Actions → Vercel (FE) + Render (BE) |

## Local Development

### Prerequisites
- Docker Desktop
- Go 1.22+
- Node.js 20+

### Setup

1. **Start the database:**
   ```bash
   docker-compose up -d
   ```

2. **Start the backend:**
   ```bash
   cd backend
   cp .env.example .env  # Edit with your API keys
   go run cmd/main.go
   ```

3. **Start the frontend:**
   ```bash
   cd frontend
   cp .env.example .env  # Edit with your API URL
   npm install
   npm run dev
   ```

4. Open http://localhost:5173

### Environment Variables

See `backend/.env` and `frontend/.env` for required variables.

## Architecture

```
stashlog/
├── backend/          # Go + Gin API server
│   ├── cmd/          # Entry point
│   ├── config/       # Environment config
│   ├── db/           # Database connection + migrations
│   ├── handlers/     # HTTP handlers
│   ├── middleware/    # Auth + rate limiting
│   ├── migrations/   # SQL migration files
│   ├── models/       # GORM models
│   ├── routes/       # Route registration
│   ├── services/     # Business logic (Gemini, Email, Cron)
│   └── utils/        # JWT, hashing, validation
├── frontend/         # React + Vite
│   └── src/
│       ├── components/  # UI components
│       ├── context/     # Auth context
│       ├── hooks/       # React Query hooks
│       ├── pages/       # Route pages
│       ├── services/    # API service layer
│       ├── store/       # Zustand stores
│       ├── types/       # TypeScript types
│       └── utils/       # Helpers + constants
└── docker-compose.yml
```

## Key Features

- 📝 **Daily Logging** — Log your work with tags (bug, feature, review, blocked, learning)
- 🤖 **AI Summaries** — Gemini generates standup summaries at 1 AM
- 📧 **Morning Email** — Receive formatted standup at 8 AM
- 📊 **Weekly Digest** — Friday 6 PM recap of your entire week
- 🔥 **Streak Tracking** — Build consistency with daily logging streaks
- 🔔 **Smart Nudges** — 8 PM reminder if you haven't logged
- 🌙 **Dark Mode** — Full light/dark theme support
- 🔒 **Secure Auth** — JWT + httpOnly cookies + bcrypt

## License

Open source. Free forever.
