# Contributing to Stashlog 🚀

First off, thank you for checking out Stashlog and wanting to contribute! This project is built by developers for developers.

Below are the guidelines and instructions to help you get started with contributing.

---

## 💻 Local Development Setup

Stashlog is split into a Go backend and a React frontend.

### Prerequisites
* Go (1.22+)
* Node.js (20+)
* Docker (for PostgreSQL database)

### Backend Setup
1. Spin up the local database:
   ```bash
   docker-compose up -d
   ```
2. Navigate to the backend directory and copy the env file:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Run the Go server:
   ```bash
   go run cmd/main.go
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🛠️ Contribution Workflow

1. **Fork the Repository:** Create a fork of the Stashlog repository under your GitHub account.
2. **Create a Branch:** Create a branch for your work:
   * For features: `feature/your-feature-name`
   * For fixes: `bugfix/your-fix-name`
3. **Commit Your Changes:** Keep commits atomic, clean, and write descriptive commit messages.
4. **Test Your Changes:** Verify that frontend builds run (`npm run build`) and backend tests pass successfully.
5. **Open a Pull Request:** Submit a PR back to our `main` branch with a clear description of the problem solved or feature added.

Thank you for your help in making Stashlog better!
