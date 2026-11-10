# JobTrack - Real-Time Job Application Tracker Website

A complete, modern, responsive, and real-time full-stack Job Application Tracker website built with Python FastAPI, MySQL / SQLAlchemy, WebSockets, Bootstrap 5, and Chart.js.

---

## 🌟 Key Features

1. **User Authentication & Isolation**
   - User registration and login with secure password hashing (`pbkdf2`/`bcrypt`) and JWT token authentication.
   - Strict data isolation: each user only accesses their own applications, companies, and documents.

2. **Company Management**
   - Record companies with website, location, HR contact email, phone number, and description.
   - Full CRUD operations and search companies by name.

3. **Job Application Management**
   - Record job position, company name, application date, interview date, salary, job location, and job type (*Full-time, Part-time, Internship, Contract*).
   - Filter by status, company, application date, and search by job position or company name.
   - Sort by newest and oldest with one-click filter clear.

4. **Application Status Management (Color Coded)**
   - **Applied** – Blue (`#2563EB`)
   - **Interview** – Purple (`#9333EA`)
   - **Selected** – Green (`#16A34A`)
   - **Rejected** – Red (`#DC2626`)
   - **On Hold** – Orange (`#EA580C`)

5. **Mandatory On Hold Reason Management**
   - When moving an application to **On Hold**, a mandatory popup prompts the user to select or enter a reason (*Company postponed recruitment, Position temporarily unavailable, Waiting for HR response, Recruitment process delayed, Budget realignment, etc.*).
   - Saves the reason in the database and records complete history in `application_status_history`.
   - Dedicated **On Hold Applications Page** displaying reasons and quick pipeline resumption.

6. **Document Upload & Association (Resumes, Cover Letters, Portfolios)**
   - Attach resumes, cover letters, portfolio links, or formal offer letters to specific applications.
   - View, download, preview, and delete documents securely.

7. **Email Notification System**
   - Automated email dispatch when an application transitions to **Selected** (congratulatory offer alert) or **Rejected** (status update).
   - Scheduled advance reminders ahead of interviews (customizable lead time: 1, 2, 3, or 5 days).
   - In-app notification outbox and preview log, with customizable user alert preferences in Profile.

8. **Real-Time Updates via WebSockets**
   - Connected clients receive instant status, application, document, and notification updates without refreshing the browser.

9. **Interactive Analytics & Dashboard**
   - 6 KPI metric cards (*Total, Applied, Interview, Selected, Rejected, On Hold*).
   - Chart.js Donut chart for status distribution.
   - Chart.js Bar chart showing submission velocity over time.
   - Recent applications and pipeline activity feed.

---

## 📁 Project Structure

```text
JobApplicationTracker/
├── frontend/
│   ├── index.html            # Landing page
│   ├── login.html            # User login
│   ├── register.html         # User registration
│   ├── dashboard.html        # Interactive dashboard with Chart.js
│   ├── applications.html     # Application management & filter table
│   ├── on_hold.html          # Dedicated On Hold reason dashboard
│   ├── companies.html        # Company directory
│   ├── profile.html          # Profile & notification preferences
│   ├── css/
│   │   └── style.css         # Bootstrap 5 theme styles
│   └── js/
│       └── api.js            # REST API client & WebSocket connector
├── backend/
│   ├── main.py               # FastAPI server & WebSocket manager
│   ├── database.py           # SQLAlchemy MySQL connector & SQLite fallback
│   ├── models.py             # Database models
│   ├── schemas.py            # Pydantic validation schemas
│   ├── auth.py               # Password hashing & JWT auth
│   └── requirements.txt      # Python dependencies
├── schema.sql                # MySQL CREATE TABLE DDL & sample seed data
└── README.md                 # Setup & running instructions
```

---

## 🚀 Quick Start Guide (VS Code)

### Prerequisites
- **Python 3.10+**
- **MySQL Server** (Optional: the backend automatically defaults to local SQLite if MySQL credentials are not configured!)
- **VS Code** with *Live Server* or Python extension

---

### Step 1: Backend Setup

1. Open a terminal in `JobApplicationTracker/backend`:
   ```bash
   cd JobApplicationTracker/backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate

   # On Windows:
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure MySQL Database (Optional):
   By default, the backend checks `MYSQL_HOST` or connects to `jobtrack_db`. If MySQL is running locally:
   ```bash
   mysql -u root -p < ../schema.sql
   ```
   Or set environment variables:
   ```bash
   export MYSQL_USER="root"
   export MYSQL_PASSWORD="your_password"
   export MYSQL_HOST="localhost"
   export MYSQL_PORT="3306"
   export MYSQL_DB="jobtrack_db"
   ```
   *(Note: If MySQL is not running, the application automatically uses SQLite `jobtrack.db` with full relational features!)*

5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will start at **http://localhost:8000** with interactive Swagger documentation at **http://localhost:8000/docs**.

---

### Step 2: Frontend Setup

1. In VS Code, navigate to `JobApplicationTracker/frontend`.
2. Right click on `index.html` and select **"Open with Live Server"** (or open `index.html` directly in your browser).
3. The frontend connects automatically to `http://localhost:8000` and the real-time WebSocket on `ws://localhost:8000/ws`.

---

## 🔑 Access With Any Email and Password

You can sign in with **any email and password** of your choice (e.g. `user@gmail.com` / `password123`). The system automatically creates your account, provisions your workspace, and provides instant access without restrictions.

You can also register a new account anytime on `register.html`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register new user account |
| `POST` | `/login` | Authenticate user & return JWT token |
| `POST` | `/logout` | Invalidate current session |
| `GET` | `/profile` | Get user details and notification settings |
| `PUT` | `/profile` | Update profile information or change password |
| `PUT` | `/preferences` | Update email alert triggers |
| `GET` | `/companies` | List user's companies (supports `?search=`) |
| `POST` | `/companies` | Create a new company record |
| `PUT` | `/companies/{id}` | Update company record |
| `DELETE` | `/companies/{id}` | Delete company |
| `GET` | `/applications` | List applications (supports `?status=`, `?company_id=`, `?search=`, `?sort=`) |
| `POST` | `/applications` | Create application (validates On Hold reason if status is On Hold) |
| `GET` | `/applications/{id}` | Get application details & attached documents |
| `PUT` | `/applications/{id}` | Update application details |
| `PATCH` | `/applications/{id}/status` | Update status (requires mandatory reason for 'On Hold', logs history, dispatches email alert) |
| `GET` | `/applications/on-hold` | Retrieve all On Hold applications with reasons |
| `GET` | `/applications/{id}/history` | Get status transition timeline |
| `POST` | `/applications/{id}/documents`| Upload resume, cover letter, or offer letter |
| `GET` | `/documents/{id}/download` | Download attached document file |
| `DELETE` | `/documents/{id}` | Delete attached document |
| `GET` | `/dashboard/statistics` | Retrieve KPI counters |
| `GET` | `/dashboard/charts` | Retrieve Chart.js status distribution and timeline |
| `GET` | `/notifications` | View email outbox & notification logs |
| `POST` | `/notifications/test` | Dispatch test email alert |
| `WS` | `/ws` | Real-time WebSocket connection for live UI broadcasts |
