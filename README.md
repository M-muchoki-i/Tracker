# ✨ Task Tracker

> **A classy, modern full-stack productivity suite for managing personal tasks, planning agendas on an interactive calendar, and dispatching summaries directly to Gmail.**

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features in Depth](#-key-features-in-depth)
  - [1. Executive Homepage & Dashboard](#1-executive-homepage--dashboard)
  - [2. Comprehensive Task Management](#2-comprehensive-task-management)
  - [3. Interactive Calendar & Scheduler](#3-interactive-calendar--scheduler)
  - [4. Gmail & Email Integration](#4-gmail--email-integration)
  - [5. Resilient Local Demo Mode](#5-resilient-local-demo-mode)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started & Running the App](#-getting-started--running-the-app)
  - [Option 1: Concurrent Dev Runner (Recommended)](#option-1-concurrent-dev-runner-recommended)
  - [Option 2: Independent Terminals](#option-2-independent-terminals)
  - [Option 3: Single-Port Production Mode](#option-3-single-port-production-mode)
- [Database & Schema Migrations](#-database--schema-migrations)
- [REST API Reference & Examples](#-rest-api-reference--examples)
- [Gmail & SMTP Setup Guide](#-gmail--smtp-setup-guide)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)
- [Automated Testing](#-automated-testing)

---

## 🎯 Overview

**Task Tracker** is designed for individuals who want a clean, aesthetic, and friction-free way to organize their daily schedule without the clutter and bloat of heavyweight enterprise project management tools.

Instead of requiring external cloud databases or complex container setups, the application is self-contained:
- It runs on a local, standard **SQLite database file** (`Backend/data/tasks.db`) managed through `better-sqlite3`.
- It pairs a lightning-fast **React 19** frontend with an **Express REST API**.
- It provides zero-configuration **1-click Gmail drafts** alongside optional **Nodemailer SMTP** background dispatch.

---

## 🌟 Key Features in Depth

### 1. Executive Homepage & Dashboard
* **Dynamic Time-Aware Greeting:** Personalized header that greets you based on local time (*Good morning*, *Good afternoon*, *Good evening*) and displays today's date.
* **Live Overview Metrics:**
  * **Total Tasks:** Cumulative volume of tasks in the database.
  * **Scheduled Tasks:** Tasks linked to a due date or calendar timeline.
  * **Due Today:** High-priority items requiring attention before end-of-day.
  * **Completed %:** Real-time completion progress bar with percentage tracking.
* **Today's Focus Spotlight:** Interactive checklist of tasks scheduled for today on the homepage, allowing quick completion without switching views.
* **Persistent Top Navigation Bar:**
  * Quick links to **Home**, **Tasks**, and **Calendar** with real-time pending badges.
  * Global **"+ New Task"** button accessible from anywhere in the app.
  * Direct **"Gmail Sync"** trigger.
  * Connection indicator displaying **Online** (connected to SQLite API) or **Demo** (running client-side fallback).

---

### 2. Comprehensive Task Management
* **Full CRUD Operations:** Create, read, update, and delete tasks.
* **Task Fields:**
  * `title`: Required text (1–200 characters).
  * `description`: Optional notes, links, or multiline deliverables.
  * `scheduledDate`: Optional ISO date/time string (e.g. `2026-10-25T14:30`).
  * `completed`: Boolean toggle (`true` / `false`).
* **Optimistic UI Updates:** Checkbox toggles reflect instantly in the user interface with automatic reversion if a network request fails.
* **Filter Tabs:** Quickly filter tasks by:
  * **All:** Complete overview of all items.
  * **Active:** Only pending / uncompleted tasks.
  * **Scheduled:** Tasks assigned a due date or time.
  * **Completed:** Finished tasks.
* **Real-time Search:** Search instantly across both task titles and descriptions.
* **Multi-Criteria Sorting:** Sort by *Newest first*, *Scheduled date*, *Oldest first*, or *Title (A-Z)*.
* **Keyboard Productivity:** Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> (or <kbd>Cmd</kbd> + <kbd>Enter</kbd>) in the form to instantly save tasks.
* **Safe Deletions:** Accessible confirmation dialog prevents accidental data removal.

---

### 3. Interactive Calendar & Scheduler
* **Full Monthly Grid:** Month view showing day numbers, current day highlights, and selected date indicators.
* **Visual Task Indicators:**
  * Colored dots on calendar days indicate task volume and urgency.
  * Emerald dots indicate all tasks on that day are completed.
  * Indigo dots indicate pending scheduled tasks.
  * Rose dots highlight overdue items.
* **Selected Day Agenda:** Clicking any date immediately displays a dedicated drill-down panel listing all items scheduled for that date, with quick check-off actions.
* **Quick Date Presets:** One-click shortcuts for scheduling tasks on **Today**, **Tomorrow**, or **Next Week**.
* **Overdue Alert Banner:** Automatically identifies past due items and offers a one-click reminder email trigger.

---

### 4. Gmail & Email Integration
* **Dual-Mode Dispatch:**
  1. **Instant Web Gmail (Zero Setup):** Pre-formats task titles, descriptions, and schedule timestamps into a clean draft and opens it directly in `mail.google.com` in a new tab. Works out of the box without configuring passwords or SMTP servers.
  2. **Direct Background SMTP:** When `GMAIL_USER` and `GMAIL_APP_PASSWORD` are configured in `Backend/.env`, the backend dispatches styled emails directly via Google's SMTP servers using Nodemailer.
* **Configurable Export Scope:**
  * **Selected Task:** Email a single item with its notes and schedule.
  * **Date Agenda:** Email all tasks scheduled for a specific calendar day.
  * **All Scheduled:** Email all upcoming scheduled milestones.
  * **All Tasks:** Full export of the entire workspace.
* **Email Template:** Beautiful, responsive HTML email formatting paired with a clean plain-text fallback.
* **Recipient Memory:** Remembers the last used recipient email in browser storage for rapid sending.

---

### 5. Resilient Local Demo Mode
* **Graceful Degradation:** If the backend server is temporarily not running (e.g., if you only launched the Vite dev server), the application automatically falls back to browser `localStorage`.
* **Zero Lost Work:** Any tasks created or toggled during offline mode are saved in the browser, accompanied by an informative banner explaining how to connect the SQLite backend.

---

## 🏗️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│   (Vite, Tailwind CSS, Lucide Icons, Mobile-first)     │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
            │ REST Calls (/api/*)            │ Direct Compose URL
            ▼                                ▼
┌───────────────────────────┐      ┌─────────────────────┐
│    Express REST API       │      │   Gmail Web Draft   │
│ (Node.js, CORS, Nodemailer)│     │  (mail.google.com)  │
└───────────┬───────────────┘      └─────────────────────┘
            │
            │ Synchronous File I/O
            ▼
┌───────────────────────────┐
│     SQLite Database       │
│    (better-sqlite3)       │
│  Backend/data/tasks.db    │
└───────────────────────────┘
```

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4 | Interactive UI, state management, routing, and styling |
| **Icons** | Lucide React | Consistent, lightweight SVG iconography |
| **Backend** | Node.js, Express 4 | RESTful API server, static asset host, error handling |
| **Database** | SQLite via `better-sqlite3` | Fast, synchronous, file-based SQL persistence |
| **Email** | Nodemailer & Gmail API | SMTP email delivery and web URL composition |
| **Testing** | Vitest & Supertest | Automated unit & integration tests with in-memory DBs |

---

## 📁 Project Directory Structure

```
Tracker/
├── package.json             # Root scripts (npm run dev, build, start, test)
├── dev.js                   # Zero-dependency concurrent dev runner
├── README.md                # Comprehensive documentation
├── index.html               # Root placeholder & fallback entry page
├── Backend/                 # Express REST API & SQLite Database
│   ├── package.json
│   ├── .env.example         # Environment template (Port, DB path, Gmail credentials)
│   ├── src/
│   │   ├── server.js        # Server entry point (reads .env, binds to 0.0.0.0:3000)
│   │   ├── app.js           # Routes, input validation, email logic, error handler
│   │   └── db.js            # SQLite schema initialization & auto-migration
│   ├── test/
│   │   └── tasks.test.js    # Vitest suite (CRUD, calendar scheduling, email tests)
│   └── data/
│       └── tasks.db         # Standard SQLite database file (persisted on disk)
└── Frontend/                # React 19 application (Vite)
    ├── package.json
    ├── vite.config.js       # Proxy config: forwards /api to http://127.0.0.1:3000
    ├── index.html           # React HTML template
    └── src/
        ├── main.jsx         # React application entry point
        ├── App.jsx          # Top-level coordinator, routing state, toast notifications
        ├── api.js           # API fetch wrapper & localStorage fallback
        ├── index.css        # Tailwind CSS imports & global base styles
        └── Components/
            ├── Navbar.jsx        # Sticky navigation bar with active route pills
            ├── HomePage.jsx      # Dashboard with metrics, greeting & today's agenda
            ├── TaskForm.jsx      # Task creation & editing form with date presets
            ├── TaskList.jsx      # Search, filter tabs, sort selector, task listing
            ├── TaskItem.jsx      # Individual task card with status badges & actions
            ├── CalendarView.jsx  # Interactive month calendar & day agenda drawer
            ├── EmailModal.jsx    # Gmail compose & SMTP dispatch modal
            ├── NewTaskModal.jsx  # Global task creation dialog
            └── ConfirmDialog.jsx # Accessible delete confirmation modal
```

---

## 💻 Prerequisites

- **[Node.js](https://nodejs.org/)** 18 or newer (comes with `npm`).
- No external database engines (Postgres, MySQL, Redis) or Docker containers required.

---

## 🚀 Getting Started & Running the App

### Option 1: Concurrent Dev Runner (Recommended)

From the project root directory (`Tracker/`), run:

```bash
npm run dev
```

This single command launches both:
- **Express Backend API** on `http://localhost:3000` (auto-restarts on file changes)
- **Vite React Frontend** on `http://localhost:5173` (with instant Hot Module Replacement)

Open **http://localhost:5173** in your browser.

---

### Option 2: Independent Terminals

If you prefer to run services in separate terminal windows:

```bash
# Terminal 1 — Backend API
cd Backend
npm run dev

# Terminal 2 — Frontend App
cd Frontend
npm run dev
```

---

### Option 3: Single-Port Production Mode

To build the frontend static bundle and serve everything from the Express server on port `3000`:

```bash
npm run build    # Compiles React app into Frontend/dist
npm start        # Express serves both the REST API and the built frontend
```

Open **http://localhost:3000** in your browser.

---

## 🗄️ Database & Schema Migrations

The database is a standard SQLite file stored at `Backend/data/tasks.db`.

### Table Schema (`tasks`):

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  description   TEXT    NOT NULL DEFAULT '',
  completed     INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
  scheduledDate TEXT    DEFAULT NULL,       -- ISO string (e.g. "2026-10-25T10:00")
  createdAt     TEXT    NOT NULL            -- ISO 8601 string
);
```

### Auto-Migration
[`Backend/src/db.js`](Backend/src/db.js) checks SQLite's `PRAGMA table_info(tasks)` on startup. If an existing database lacks newer columns (such as `scheduledDate`), it executes:
```sql
ALTER TABLE tasks ADD COLUMN scheduledDate TEXT DEFAULT NULL;
```
This ensures pre-existing databases seamlessly upgrade with zero data loss.

---

## 📡 REST API Reference & Examples

All endpoints return JSON responses. Errors follow the format `{ "error": "message" }`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check (`{ "status": "ok" }`) |
| `GET` | `/api/tasks` | List all tasks ordered newest first |
| `POST` | `/api/tasks` | Create a new task |
| `PATCH` | `/api/tasks/:id` | Update title, description, completed status, or schedule date |
| `DELETE` | `/api/tasks/:id` | Delete task by ID (`204 No Content`) |
| `POST` | `/api/tasks/send-email` | Send tasks agenda via Gmail / SMTP |
| `POST` | `/api/tasks/:id/send-email`| Send a single specific task to email |

### Example Payloads

#### 1. Create a Scheduled Task
**`POST /api/tasks`**
```json
{
  "title": "Review Q4 Marketing Deliverables",
  "description": "Analyze campaign metrics and align with executive goals.",
  "scheduledDate": "2026-10-25T14:00"
}
```
**Response (`201 Created`):**
```json
{
  "id": 1,
  "title": "Review Q4 Marketing Deliverables",
  "description": "Analyze campaign metrics and align with executive goals.",
  "completed": false,
  "scheduledDate": "2026-10-25T14:00",
  "createdAt": "2026-10-16T09:00:00.000Z"
}
```

#### 2. Update a Task (Mark Done & Change Date)
**`PATCH /api/tasks/1`**
```json
{
  "completed": true,
  "scheduledDate": "2026-10-26"
}
```

#### 3. Send Agenda to Gmail
**`POST /api/tasks/send-email`**
```json
{
  "to": "colleague@example.com",
  "subject": "Scheduled Task Agenda",
  "sendAllScheduled": true
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "sent": true,
  "message": "Email successfully sent to colleague@example.com!",
  "taskCount": 4,
  "gmailUrl": "https://mail.google.com/mail/?view=cm&fs=1&to=..."
}
```

---

## 📧 Gmail & SMTP Setup Guide

The app works with **zero setup** using the 1-click **"Open in Gmail"** button. If you also want the backend to dispatch background emails directly:

1. Copy the sample environment file in `Backend`:
   ```bash
   cp Backend/.env.example Backend/.env
   ```
2. Enable 2-Step Verification on your Google Account.
3. Generate a 16-character **App Password** at:
   👉 **[Google Account App Passwords](https://myaccount.google.com/apppasswords)**
4. Edit `Backend/.env`:
   ```env
   PORT=3000
   DATABASE_PATH=./data/tasks.db
   GMAIL_USER=yourname@gmail.com
   GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
   ```
5. Restart your backend server. The app will now dispatch emails directly through Gmail's SMTP servers!

---

## ❓ Troubleshooting & FAQs

### Q: `[vite] http proxy error: /api/tasks Error: connect ECONNREFUSED 127.0.0.1:3000`
**Cause:** The Vite dev server is running, but the Express backend on port `3000` is offline.
**Solution:**
- Run `npm run dev` in the **project root** to launch both backend and frontend simultaneously.
- Alternatively, open a second terminal and run `cd Backend && npm run dev`.

### Q: Where is my data saved?
**Answer:** All tasks and scheduling data are saved inside [`Backend/data/tasks.db`](Backend/data/tasks.db). This is a standard SQLite database file that persists across server restarts.

### Q: Can I run this in Docker?
**Answer:** Docker is completely unnecessary. The project runs locally with plain `node` and `npm`, but you can containerize it if you ever deploy to container platforms.

---

## 🧪 Automated Testing

The backend includes a comprehensive test suite powered by **Vitest** and **Supertest**. Tests run against an isolated **in-memory SQLite database (`:memory:`)**, ensuring test runs never alter your real data.

To execute the test suite:

```bash
npm test
# Or from the Backend directory:
cd Backend && npm test
```

### Test Coverage Includes:
- `GET /api/tasks`: Initial empty state and sorting.
- `POST /api/tasks`: Task creation, title length validation (1–200 characters), whitespace trimming.
- `PATCH /api/tasks/:id`: Toggle completion, title/description updates, scheduled date modifications, and 404 handling.
- `DELETE /api/tasks/:id`: Removal and missing task checks.
- `Calendar & Scheduling`: Creation and updating of scheduled dates.
- `POST /api/tasks/send-email`: Recipient email validation, agenda formatting, and Gmail URL generation.

---

## 📄 License

This project is licensed under the MIT License.

#### 1. Create a Scheduled Task
**`POST /api/tasks`**
```json
{
  "title": "Review Q4 Marketing Deliverables",
  "description": "Analyze campaign metrics and align with executive goals.",
  "scheduledDate": "2026-10-25T14:00"
}
```
**Response (`201 Created`):**
```json
{
  "id": 1,
  "title": "Review Q4 Marketing Deliverables",
  "description": "Analyze campaign metrics and align with executive goals.",
  "completed": false,
  "scheduledDate": "2026-10-25T14:00",
  "createdAt": "2026-10-16T09:00:00.000Z"
}
```

#### 2. Update a Task (Mark Done & Change Date)
**`PATCH /api/tasks/1`**
```json
{
  "completed": true,
  "scheduledDate": "2026-10-26"
}
```

#### 3. Send Agenda to Gmail
**`POST /api/tasks/send-email`**
```json
{
  "to": "colleague@example.com",
  "subject": "Scheduled Task Agenda",
  "sendAllScheduled": true
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "sent": true,
  "message": "Email successfully sent to colleague@example.com!",
  "taskCount": 4,
  "gmailUrl": "https://mail.google.com/mail/?view=cm&fs=1&to=..."
}
```

---

## 📧 Gmail & SMTP Setup Guide

The app works with **zero setup** using the 1-click **"Open in Gmail"** button. If you also want the backend to dispatch background emails directly:

1. Copy the sample environment file in `Backend`:
   ```bash
   cp Backend/.env.example Backend/.env
   ```
2. Enable 2-Step Verification on your Google Account.
3. Generate a 16-character **App Password** at:
   👉 **[Google Account App Passwords](https://myaccount.google.com/apppasswords)**
4. Edit `Backend/.env`:
   ```env
   PORT=3000
   DATABASE_PATH=./data/tasks.db
   GMAIL_USER=yourname@gmail.com
   GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
   ```
5. Restart your backend server. The app will now dispatch emails directly through Gmail's SMTP servers!

---

## ❓ Troubleshooting & FAQs

### Q: `[vite] http proxy error: /api/tasks Error: connect ECONNREFUSED 127.0.0.1:3000`
**Cause:** The Vite dev server is running, but the Express backend on port `3000` is offline.
**Solution:**
- Run `npm run dev` in the **project root** to launch both backend and frontend simultaneously.
- Alternatively, open a second terminal and run `cd Backend && npm run dev`.

### Q: Where is my data saved?
**Answer:** All tasks and scheduling data are saved inside [`Backend/data/tasks.db`](Backend/data/tasks.db). This is a standard SQLite database file that persists across server restarts.

### Q: Can I run this in Docker?
**Answer:** Docker is completely unnecessary. The project runs locally with plain `node` and `npm`, but you can containerize it if you ever deploy to container platforms.

---

## 🧪 Automated Testing

The backend includes a comprehensive test suite powered by **Vitest** and **Supertest**. Tests run against an isolated **in-memory SQLite database (`:memory:`)**, ensuring test runs never alter your real data.

To execute the test suite:

```bash
npm test
# Or from the Backend directory:
cd Backend && npm test
```

### Test Coverage Includes:
- `GET /api/tasks`: Initial empty state and sorting.
- `POST /api/tasks`: Task creation, title length validation (1–200 characters), whitespace trimming.
- `PATCH /api/tasks/:id`: Toggle completion, title/description updates, scheduled date modifications, and 404 handling.
- `DELETE /api/tasks/:id`: Removal and missing task checks.
- `Calendar & Scheduling`: Creation and updating of scheduled dates.
- `POST /api/tasks/send-email`: Recipient email validation, agenda formatting, and Gmail URL generation.

---

## 📄 License

This project is licensed under the MIT License.

