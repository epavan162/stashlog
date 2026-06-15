# Stashlog — Go Backend REST API ⚙️

This is the high-performance REST API backend for Stashlog, written in Go using Gin, GORM, golang-migrate, Google Gemini API, and Brevo Email API.

---

## 📦 Core Dependencies (go.mod)

*   **Gin Gonic**: High-performance HTTP web framework.
*   **GORM**: Active record ORM supporting PostgreSQL drivers, queries, and relations.
*   **Golang-Migrate**: Automates Up/Down SQL schema migrations on startup.
*   **Cron**: Runs cron schedules to process timezone-aware standup routines.
*   **Go-JWT**: Signs and verifies token claims.
*   **Bcrypt**: Encrypts password hashes.

---

## ⚙️ Environment Variables
Create a `backend/.env` file in this directory:
```env
PORT=8080
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgres://postgres:postgres@localhost:5432/stashlog?sslmode=disable
JWT_SECRET=super-secret-access-token-key-stashlog
JWT_REFRESH_SECRET=super-secret-refresh-token-key-stashlog
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GEMINI_API_KEY=your-gemini-api-key
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=your-sender-email@domain.com
BREVO_SENDER_NAME=Stashlog
MOCK_MODE=false
```

---

## 🔑 Authentication Architecture
*   **Access Token**: 15 minutes validity. Signed JWT containing user claims. Read from the standard `Authorization: Bearer <token>` header.
*   **Refresh Token**: 7 days validity. Stored in GORM `sessions` table. Read/write via Secure, `httpOnly`, Lax SameSite cookies.
*   **OAuth**: Integrates with Google OAuth. Verifies tokens via Google API, and automatically links/reactivates or registers accounts.
*   **Soft Delete Protection**: Detects deleted users. Blocks credential logins, and automatically hard-deletes soft-deleted records prior to new signups or Google OAuth linkages to prevent DB duplicate key constraints.

---

## 🗓️ Cron Scheduler Logic
The cron system checks timezone offsets for all verified users every 30 minutes, running the following tasks exactly at the user's local times:
*   **12 AM (Daily Summary)**: Tuesday–Saturday generates daily summaries for Monday–Friday logs. Skips if no logs.
*   **8 AM (Daily Standup Email)**: Monday sends Friday's summary (with *"last Friday"* subject). Tuesday–Friday sends yesterday's summary. Skips if no summary.
*   **8 PM (Nudge Email)**: Reminds users on weekdays if they have not logged any work for today.
*   **Saturday 10 AM (Weekly Summary & Digest)**: Synthesizes weekly logs/summaries (requires user to be registered $\ge$ 3 days) and delivers the weekly digest email containing the summary, days logged ($X/5$), and streak counts.

---

## 🐳 Docker and Render Deployment

### Dockerfile Builder
The `Dockerfile` compiles the Go binary using the stable Alpine Go compiler image and packages database migrations:
*   **Builder**: `golang:alpine` (dynamic version matching `go.mod`)
*   **Runner**: `alpine:3.19` (packages CA certificates and `tzdata` timezone database).

### Supabase Connection Pooling
To connect from IPv4-only networks (like Render's Free tier) to Supabase without encountering routing failures:
*   Use the **Transaction Pooler** string pointing to Port **`6543`**:
    `postgresql://[user].[id]:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`
*   Change Render's **Health Check Path** from `/healthz` to **`/health`**.
*   Setup **Cron-Job.org** to ping `/health` every 10 minutes to prevent Render's Free tier from sleeping.
