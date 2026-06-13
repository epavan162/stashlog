# Stashlog — Frontend Client 💻

This is the React Single Page Application (SPA) client for Stashlog, built with React 19, Vite, TypeScript, Tailwind CSS, Zustand, and TanStack React Query.

---

## 📦 Installed Libraries & Dependencies

*   **Vite**: Fast development build server and asset bundler.
*   **TypeScript**: Static typing for robustness and interface contracts.
*   **Tailwind CSS**: Utility-first CSS framework coupled with custom theme tokens.
*   **Framer Motion**: Smooth micro-interactions, page transitions, and dashboard modal load animations.
*   **Lucide React**: Vector SVG icon sets.
*   **Zustand**: Clean, lightweight global client state management (stores for Auth credentials and Theme selection).
*   **TanStack React Query**: Server state synchronizer, query caching, and auto-refetching.
*   **Axios**: HTTP client configured with automatic 401 token refresh interceptors.
*   **Date-fns**: Date parsing, calculations, and local timezone formats.

---

## 🎨 Design System & Custom Styling
The application styling is declared in `src/index.css` using theme variables and custom Tailwind tokens:
*   **Light Mode background**: `#f4f1ec` (terracotta cream)
*   **Dark Mode background**: `#0a0910` (deep dark violet-black)
*   **Accent Color**: `#c2533c` (terracotta copper)
*   **Typography**: *Inter Tight* (headers), *Instrument Serif* (landing headings), and *JetBrains Mono* (dates and data).
*   **Accessibility**: Buttons under 44px (such as the standard `sm` buttons) use absolute pseudo-elements (`after:`) to expand their vertical touch target to exactly 44px, satisfying mobile usability criteria.

---

## 📂 Navigation & Routing
Defined in `App.tsx` and managed by React Router:
*   `/` → `Landing.tsx` (Interactive landing screen with feature highlights)
*   `/login` → `Login.tsx` (Email login + Google OAuth login)
*   `/register` → `Register.tsx` (Sign up form with validator patterns)
*   `/verify-email` → `VerifyEmail.tsx` (Landing page for email token activation)
*   `/set-password` → `SetPassword.tsx` (Google-only sign-up redirect to set password)
*   `/dashboard` → `Dashboard.tsx` (Main workspace for log entries, streak progress, and AI summaries)
*   `/history` → `History.tsx` (Monthly log calendar with tag indicators and modal lists)
*   `/settings` → `Settings.tsx` (Preferences, active sessions manager, and delete account)

---

## ⚙️ Local Environment Variables
Create a `frontend/.env` file in this directory:
```env
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 🛠️ CLI Build Commands

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start development server**:
    ```bash
    npm run dev
    ```
3.  **Compile production bundle**:
    ```bash
    npm run build
    ```
    *Build outputs will compile into the `dist/` directory.*

---

## 🚀 Vercel Production Settings

1.  Create a project on Vercel importing this repository.
2.  **Root Directory**: Set this to **`frontend`**.
3.  **Framework Preset**: Select **`Vite`**.
4.  **Environment Variables**:
    *   `VITE_API_URL` = Production Go API URL (e.g. `https://stashlog-api.onrender.com`)
    *   `VITE_GOOGLE_CLIENT_ID` = Google Client ID.
5.  **SPA Router Redirects**: A `vercel.json` file in this directory routes all path queries (like `/dashboard` and `/history`) back to `index.html` to prevent 404 page reload errors in production.
