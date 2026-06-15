# Stashlog 🚀

**Your daily work. Remembered. Standup-ready.**

Stashlog is a personal daily work logging application for developers that formats daily entries into clean, professional standup summaries using Google Gemini AI, and delivers them directly to your inbox every morning.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Clean, fast, modern SPA architecture |
| **Styling** | Vanilla CSS + Tailwind | Customized tokens, dark-mode, and glassmorphism |
| **State** | Zustand + React Query | In-memory auth state and server state caching |
| **Backend** | Go 1.25 + Gin | High-performance, lightweight REST API |
| **Database** | PostgreSQL 16 (Supabase) | Robust relational storage with indexing |
| **AI Engine** | Google Gemini 1.5 Flash | High-speed contextual daily and weekly recaps |
| **Email API** | Brevo HTTP REST API | Reliable delivery for verification, nudges, and digests |
| **CI/CD** | GitHub Actions | Automated lint, build, test, and deploy pipelines |

---

## 📂 Project Architecture

```
stashlog/
├── .github/workflows/  # CI/CD pipelines
│   ├── backend.yml     # Go compilation, unit tests, and Render deploy hooks
│   └── frontend.yml    # Node build and Vercel production deployment
├── backend/            # Go REST API Server
│   ├── cmd/            # Main server entry + seed scripts
│   ├── config/         # Environment variable parsing and defaults
│   ├── db/             # GORM connection setup and golang-migrate trigger
│   ├── handlers/       # Endpoint handlers (Auth, Logs, User, Summaries)
│   ├── middleware/     # JWT authentication, CORS, and Rate Limiting
│   ├── migrations/     # Database Up/Down SQL migration scripts
│   ├── models/         # GORM database schemas and structs
│   ├── routes/         # HTTP Route registrations
│   ├── services/       # Core business logic (Gemini, Email, Cron, Streaks)
│   └── utils/          # Hashing, validation, JWT helpers
├── frontend/           # React SPA Client
│   ├── public/         # Static assets and custom SVGs
│   ├── src/
│   │   ├── components/ # Dashboard modules, calendar views, dialog templates
│   │   ├── context/    # Global React Auth context
│   │   ├── hooks/      # React Query query hooks and custom state listeners
│   │   ├── pages/      # Route pages (Landing, Login, Dashboard, Settings, etc.)
│   │   ├── services/   # Axios API integrations
│   │   ├── store/      # Zustand store configurations (Theme, Auth)
│   │   ├── types/      # TypeScript declarations
│   │   └── utils/      # General helpers and constants
│   ├── vercel.json     # SPA routing configuration for Vercel
│   └── vite.config.ts  # Vite build rules
```

---

## 🌟 Key Features

*   📝 **Daily Logging**: Log your work items with specific tags (`Bug`, `Feature`, `Review`, `Blocked`, `Learning`). Only one tag is active per entry.
*   🤖 **Gemini AI Summaries**: Automatically fetches the daily log entries at 1 AM in your local timezone, merges them with tag context, and compiles them into a standard standup format: *What I Did*, *Blockers*, and *Plan for Tomorrow*. Includes a 3-attempt exponential backoff retry and raw log fallbacks.
*   📧 **Morning Standup Emails**: Delivers the AI-generated daily standup summary directly to your inbox at 8 AM local time (Tuesday–Friday receives *"yesterday's"* logs, and Monday receives *"last Friday's"* logs).
*   📊 **Weekly Recap Digests**: Generates a weekly recap summary at 11 PM on Fridays and sends a digest email at 8 AM on Saturdays showing days logged ($X/5$) and current streaks.
*   🔔 **8 PM Nudges**: Sends an email reminder at 8 PM local time on weekdays if you haven't logged any work for the day.
*   🔥 **Streak Tracker**: Tracks your consecutive logged weekdays (Saturdays and Sundays are automatically skipped to protect streaks over weekends).
*   🛋️ **Weekend Rest Screen**: On Saturdays and Sundays, the log editor is hidden and replaced by a "Rest up!" weekend dashboard displaying your weekly AI summary and current streak.
*   📅 **Visual Calendar**: A calendar dashboard in the History page displaying color-coded tag indicator dots (up to 4, then a `+` indicator) and sparkle icons for dates that have AI-generated summaries. Includes a global tag filter.
*   📱 **Responsive Mobile UI**: Desktop centered dialog modals adapt automatically into full-screen slide sheets on viewports under 768px.
*   ⚠️ **Email Bounce Warnings**: Detects bounced emails using Brevo logs and renders a prominent warning banner inside the dashboard.
*   🔒 **Soft-Delete Support**: Securely handles deleted accounts. Blocks credential logins to deleted accounts while cleaning up database records during new registrations or Google OAuth sign-ups.
*   🔘 **Enhanced Touch Targets**: Buttons under 44px (like `sm` buttons) use absolute pseudo-elements (`after:`) to expand their vertical touch target to exactly 44px for mobile accessibility.

---

## 💻 Local Development Setup

### Prerequisites
*   Docker Desktop
*   Go (version 1.22+)
*   Node.js (version 20+)

### Step-by-Step Instructions

1.  **Launch PostgreSQL**:
    ```bash
    docker-compose up -d
    ```
2.  **Run Go Backend**:
    ```bash
    cd backend
    cp .env.example .env  # Add your API keys (Gemini, Brevo, Google OAuth)
    go run cmd/main.go
    ```
3.  **Run React Client**:
    ```bash
    cd frontend
    cp .env.example .env  # Configure VITE_API_URL pointing to the backend
    npm install
    npm run dev
    ```
4.  Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚀 Production Deployment Guide

### 1. Database Provisioning (Supabase)
*   Create a new PostgreSQL database on [Supabase](https://supabase.com/).
*   Copy the **URI Connection String** under Database Settings.
*   Append `?sslmode=require` to force a secure SSL connection.
*   *Example URL*: `postgresql://postgres.[id]:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require` (using Port `6543` for IPv4 connection poolers).

### 2. Backend Web Service (Render)
*   Create a new **Web Service** on Render pointing to your GitHub repository.
*   **Root Directory**: `backend`
*   **Runtime**: `Docker`
*   **Health Check Path**: `/health` (crucial to change this from the default `/healthz`)
*   **Environment Variables**: Paste your `.env` variables (e.g. `DATABASE_URL`, `MOCK_MODE=false`, Google/Gemini/Brevo API keys).
*   *Note*: Migrations automatically run on startup using the `migrations/` files copied into the Docker container.

### 3. Frontend Hosting (Vercel)
*   Create a new **Project** on Vercel importing your repository.
*   **Root Directory**: `frontend`
*   **Framework Preset**: `Vite`
*   **Environment Variables**:
    *   `VITE_API_URL` = Your Render backend URL (e.g. `https://stashlog-api.onrender.com`)
    *   `VITE_GOOGLE_CLIENT_ID` = Your Google OAuth client credential ID.

### 4. Render Awake Workaround (Uptime Ping)
If deploying the backend on Render's **Free Tier**, it will spin down (sleep) after 15 minutes of inactivity. This will pause the internal timezone cron checks.
*   **Solution**: Create a free account on [Cron-Job.org](https://cron-job.org/).
*   Add a cron job pointing to `https://[your-render-backend-name].onrender.com/health` scheduled to run **Every 10 minutes** to keep the server awake 24/7.

### 5. Automated CI/CD (GitHub Actions)
Add these secrets to your GitHub repository under **Settings** → **Secrets and variables** → **Actions**:
*   `VERCEL_TOKEN`: Vercel Personal Access Token
*   `VERCEL_ORG_ID`: Your Vercel User/Team ID
*   `VERCEL_PROJECT_ID`: Your Vercel Project ID
*   `RENDER_DEPLOY_HOOK_URL`: Webhook URL copied from Render Web Service Settings.

On push to `main` branch, workflows will automatically build, test, and deploy either the frontend or backend depending on which folder has changes.

---

## 📄 License
Open source project. Free to use forever.
