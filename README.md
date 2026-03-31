---

# 🎓 NIIST Academia

### AI-Integrated Smart Academic Management System
### NRI Institute of Information Science & Technology, Bhopal

---

![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)
![Ollama](https://img.shields.io/badge/Ollama-Llama3.2-black?style=for-the-badge)
![License](https://img.shields.io/badge/License-Academic-green?style=for-the-badge)

---

## 📌 Overview

NIIST Academia is a comprehensive,
full-stack academic management platform
built exclusively for the Department of
Computer Science & Engineering at NRI
Institute of Information Science &
Technology (NIIST), Bhopal.

The system streamlines all academic
operations including attendance tracking,
marks management, assignments, notes,
project monitoring and departmental
communication — all powered by a
locally hosted AI model (Llama 3.2 3B
via Ollama) that runs completely offline
without any external API dependencies.

> **University:** RGPV (Rajiv Gandhi
> Proudyogiki Vishwavidyalaya)
>
> **Principal:** Dr. Puran Gour
>
> **Department:** Computer Science
> & Engineering (CSE)

---

## ✨ Features

### 👑 HOD Features
- Complete department overview dashboard
- Add and manage faculty accounts
- Bulk student upload via Excel/PDF
  with AI data extraction
- Create and publish timetables
  with conflict detection
- Manage academic calendar and holidays
- View all sessions, students,
  attendance and marks
- Department wide performance analytics
- Login activity monitoring
- Pin important notices (max 3)
- Download PDF reports

### 👨‍🏫 Faculty Features
- Manage assigned subjects per session
- Unit wise syllabus topic checklist
  with completion tracking
- Mark daily attendance with
  one click Mark All Present
- Color coded attendance calendar view
- Enter MST 1, MST 2, Internal
  and Practical marks
- AI powered assignment question
  generator (Ollama Llama 3.2 3B)
- Track physical assignment submissions
- Upload study notes (PDF/PPT/DOC)
- Manage project teams and milestones
- Post notices to department,
  session or subject level
- View student details with
  parent contact information
- Update own profile details

### 👨‍🎓 Student Features (View Only)
- Personalized dashboard with alerts
- Subject wise attendance with
  calendar view (color coded)
- Attendance summary with
  classes needed calculation
- MST 1, MST 2, Internal and
  Practical marks view
- Subject rank display
- View and download uploaded notes
- Assignment deadlines with
  countdown timers
- Check assignment submission status
  and rejection reasons
- Notice board with unread badges
- Project team and milestone tracking
- Session based timetable view

### 🤖 AI Features (100% Local/Offline)
- Assignment question generator
  (subject + unit + difficulty based)
- Bulk student data extraction
  from Excel and PDF files
- Attendance alert calculation
  (below 75% detection)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL 15 |
| Authentication | JWT (7 day expiry) |
| AI Service | Python FastAPI |
| AI Model | Llama 3.2 3B (local) |
| AI Runner | Ollama |
| Containerization | Docker + Docker Compose |
| File Uploads | Multer |
| PDF Reports | PDFKit |
| Charts | Recharts |

---

## 🏗️ Architecture

The system runs as 6 Docker containers
communicating over an internal bridge
network (niist_network):
Browser
↓
[React:3000] ←→ [Node.js:5000] ←→ [PostgreSQL:5432]
↓
[FastAPI:8000] ←→ [Ollama:11434]

Only ports 3000, 5000, 8000 are
exposed to the host machine.
PostgreSQL and Ollama are sealed
within the internal Docker network.

---

## 📁 Project Structure
```text
niist-academia/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── common/    # Shared components
│   │   ├── pages/
│   │   │   ├── auth/      # Login page
│   │   │   ├── hod/       # HOD pages (12)
│   │   │   ├── faculty/   # Faculty pages (10)
│   │   │   └── student/   # Student pages (8)
│   │   ├── context/       # Auth context
│   │   ├── services/      # Axios API client
│   │   └── utils/         # Helpers & constants
│   └── ...
│
├── server/                 # Node.js Backend
│   ├── controllers/        # Business logic (14)
│   ├── routes/            # API routes (14)
│   ├── middleware/        # Auth & role guards
│   ├── utils/             # Notice helper
│   ├── db/
│   │   ├── 01_init.sql    # All 27 tables
│   │   └── 02_seed.sql    # Test data
│   ├── uploads/           # User uploaded files
│   └── server.js          # Entry point
│
├── ai-service/            # Python FastAPI
│   ├── routes/            # AI endpoints (3)
│   ├── services/          # Ollama + file parser
│   └── main.py            # FastAPI entry
│
├── docker/                # Dockerfiles (3)
└── docker-compose.yml     # Orchestration
```

---

## 📋 Prerequisites

Before running this project make sure
you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Git | Latest | https://git-scm.com |

> **Note:** Node.js, Python and
> PostgreSQL do NOT need to be
> installed locally. Everything
> runs inside Docker containers.

> **Hardware:** The AI model (Llama 3.2 3B)
> runs on CPU only. Minimum 8GB RAM
> recommended. First startup downloads
> ~2GB model file.

---

## 🚀 Installation & Setup

### Step 1 — Clone the repository
```bash
git clone https://github.com/yourusername/niist-academia.git
cd niist-academia
```

### Step 2 — Configure environment files

The project needs 3 environment files.
Create them from the examples:

**Root .env** (already exists):
```env
# No changes needed
# Docker Compose reads this automatically
```

**server/.env** (already exists):
```env
PORT=5000
DB_HOST=postgres
DB_PORT=5432
DB_USER=niist_user
DB_PASSWORD=niist_pass
DB_NAME=niist_academia
JWT_SECRET=niist_super_secret_jwt_2024
AI_SERVICE_URL=http://ai-service:8000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**client/.env** (already exists):
```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8000
```

**ai-service/.env** (already exists):
```env
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b
```

### Step 3 — Build and run
```bash
docker-compose up --build
```

### First startup note
The first time you run this command:
- Docker will build all 3 images
  (takes 3-5 minutes)
- Ollama will download the Llama 3.2 3B
  model (~2GB, takes 5-15 minutes
  depending on internet speed)
- PostgreSQL will create all 27 tables
  and insert seed data automatically

Subsequent startups take under
30 seconds.

### Step 4 — Open in browser
http://localhost:3000

---

## 🔑 Environment Variables

### server/.env

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Backend server port | 5000 |
| DB_HOST | PostgreSQL container name | postgres |
| DB_PORT | PostgreSQL port | 5432 |
| DB_USER | Database username | niist_user |
| DB_PASSWORD | Database password | niist_pass |
| DB_NAME | Database name | niist_academia |
| JWT_SECRET | JWT signing secret | (set value) |
| AI_SERVICE_URL | AI service URL | http://ai-service:8000 |
| CLIENT_URL | Frontend URL for CORS | http://localhost:3000 |
| NODE_ENV | Environment | development |

### client/.env

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base URL |
| VITE_AI_URL | AI service base URL |

> ⚠️ **Important:** In Docker, DB_HOST
> must be the container name `postgres`
> not `localhost`. Same for AI_SERVICE_URL
> using `ai-service` not `localhost`.

---

## 🖥️ Running the Project

### Start all services
```bash
docker-compose up --build
```

### Start in background (detached)
```bash
docker-compose up -d --build
```

### Stop all services
```bash
docker-compose down
```

### Stop and remove all data
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker logs niist_server
docker logs niist_client
docker logs niist_postgres
docker logs niist_ai
docker logs niist_ollama
```

### Rebuild specific service
```bash
docker-compose up --build server
docker-compose up --build client
```

### Health checks
```bash
# Backend API
curl http://localhost:5000/api/health

# AI Service
curl http://localhost:8000/health

# Ollama
curl http://localhost:11434
```

---

## 🔐 Default Credentials

### HOD Account (Pre-seeded)
| Field | Value |
|-------|-------|
| Email | hod@niist.ac.in |
| Password | NIIST@HOD001 |
| Name | Dr. Puran Gour |
| Role | HOD (Principal) |

### Faculty Accounts (Test)
| Employee ID | Email | Password |
|-------------|-------|----------|
| FAC001 | sharma@niist.ac.in | NIIST@FAC001 |
| FAC002 | singh@niist.ac.in | NIIST@FAC002 |

### Student Accounts (Test)
| Enrollment | Password |
|------------|----------|
| 0115CS231001 | NIIST@1001 |
| 0115CS231002 | NIIST@1002 |
| 0115CS231003 | NIIST@1003 |
| 0115CS231004 | NIIST@1004 |
| 0115CS231005 | NIIST@1005 |

### Password Format
Faculty default: NIIST@{EmployeeID}
Student default: NIIST@{Last4DigitsOfEnrollment}
Example:
Employee ID FAC001 → NIIST@FAC001
Enrollment 0115CS231001 → NIIST@1001
Passwords can be changed anytime
from the Profile section.

---

## 🌐 API Endpoints Reference

### Authentication
```text
POST   /api/auth/login
GET    /api/auth/me
```

### HOD Management
```text
GET    /api/hod/faculty
POST   /api/hod/faculty
PUT    /api/hod/faculty/:id
PUT    /api/hod/faculty/:id/deactivate
PUT    /api/hod/faculty/:id/activate
GET    /api/hod/students
GET    /api/hod/students/:id
POST   /api/hod/students/bulk-upload
GET    /api/hod/subjects
POST   /api/hod/subjects
GET    /api/hod/subject-assignments
POST   /api/hod/subject-assignments
DELETE /api/hod/subject-assignments/:id
GET    /api/hod/students/search
GET    /api/hod/login-logs
```

### Faculty
```text
GET    /api/faculty/subjects
GET    /api/faculty/subjects/:sa_id/topics
POST   /api/faculty/subjects/:sa_id/topics
PUT    /api/faculty/topics/:id/complete
DELETE /api/faculty/topics/:id
GET    /api/faculty/students/:sa_id
GET    /api/faculty/students/detail/:id
GET    /api/faculty/profile/me
PUT    /api/faculty/profile/me
PUT    /api/faculty/profile/hod
PUT    /api/faculty/profile/password
POST   /api/faculty/profile/photo
```

### Attendance
```text
GET    /api/attendance/:sa_id/:date
POST   /api/attendance/mark
PUT    /api/attendance/:id
GET    /api/attendance/summary/:student_id
GET    /api/attendance/calendar/:student_id/:subject_id/:month/:year
GET    /api/attendance/hod/overview
```

### Marks
```text
GET    /api/marks/setup/:sa_id
POST   /api/marks/setup
GET    /api/marks/:sa_id
POST   /api/marks/enter
GET    /api/marks/student/:student_id
GET    /api/marks/rank/:sa_id
GET    /api/marks/distribution/:sa_id
GET    /api/marks/hod/overview
```

### Assignments
```text
GET    /api/assignments/:sa_id
POST   /api/assignments
PUT    /api/assignments/:ca_id
DELETE /api/assignments/:ca_id
GET    /api/assignments/:ca_id/submissions
PUT    /api/assignments/submissions/:id
GET    /api/assignments/student/all
POST   /api/assignments/ai-generate
GET    /api/assignments/upcoming/:student_id
GET    /api/assignments/upcoming/faculty
```

### Notes
```text
GET    /api/notes/:sa_id
POST   /api/notes/upload
PUT    /api/notes/:id
DELETE /api/notes/:id
GET    /api/notes/student/subjects
GET    /api/notes/download/:id
```

### Notices
```text
GET    /api/notices
POST   /api/notices
PUT    /api/notices/:id
DELETE /api/notices/:id
POST   /api/notices/:id/read
GET    /api/notices/unread-count
PUT    /api/notices/:id/pin
GET    /api/notices/:id/stats
```

### Projects
```text
GET    /api/projects/:session_id
POST   /api/projects
PUT    /api/projects/:id
PUT    /api/projects/:id/toggle
GET    /api/projects/:id/teams
POST   /api/projects/:id/teams
PUT    /api/projects/teams/:id
POST   /api/projects/teams/:id/members
DELETE /api/projects/teams/:id/members/:student_id
GET    /api/projects/:id/milestones
POST   /api/projects/:id/milestones
PUT    /api/projects/milestones/:id
DELETE /api/projects/milestones/:id
GET    /api/projects/hod/overview
```

### Timetable
```text
GET    /api/timetable/slots
POST   /api/timetable/slots
PUT    /api/timetable/slots/:id
DELETE /api/timetable/slots/:id
GET    /api/timetable/:session_id/:semester
POST   /api/timetable
DELETE /api/timetable/:id
POST   /api/timetable/publish
GET    /api/timetable/faculty/mine
GET    /api/timetable/student/mine
```

### Academic Calendar & Holidays
```text
GET    /api/calendar/:session_id
POST   /api/calendar
DELETE /api/calendar/:id
GET    /api/holidays
POST   /api/holidays
DELETE /api/holidays/:id
```

### Reports
```text
GET    /api/reports/attendance/:student_id
GET    /api/reports/marks/:student_id
GET    /api/reports/attendance/session/:id
GET    /api/reports/marks/session/:id
```

### AI Service
```text
POST   /ai/assignment/generate
POST   /ai/bulk/upload
POST   /ai/attendance/check
GET    /health
```

---

## 📦 4 Module Breakdown

### Module 1 — Foundation & User Management
> Week 1-2 of development

- JWT Authentication system
- HOD adds and manages faculty
- Bulk student upload with AI extraction
- Session and branch management
- Time slots setup
- Timetable creation with conflict detection
- Academic calendar management
- Holiday management
- Role based dashboards

### Module 2 — Academic Management
> Week 3-4 of development

- Subject management
- Unit wise syllabus topic tracking
- Daily attendance marking system
- Color coded attendance calendar
- Auto attendance alerts below 75%
- MST 1 and MST 2 marks entry
- Internal and practical marks
- Student rank calculation
- Performance distribution graphs
- HOD attendance and marks overview

### Module 3 — Content & Communication
> Week 5-6 of development

- Faculty notes upload system
- AI powered assignment creation
- Physical submission tracking
- Deadline countdown timers
- Notice board with pinning
- Auto notifications for all events
- Unread notice badges
- Notice read tracking

### Module 4 — Project & AI Intelligence
> Week 7-8 of development

- Project module with team formation
- Milestone and deadline tracking
- Auto notices on milestone updates
- HOD intelligence dashboard
- PDF report generation
- Dark mode toggle
- Student search system
- Login activity monitoring
- Complete UI polish and responsiveness

---

## 🗄️ Database Schema

The system uses **27 PostgreSQL tables**
organized in 3NF (Third Normal Form):

| Group | Tables |
|-------|--------|
| Core | sessions, branches, time_slots, users |
| People | students, student_parents, faculty, login_logs |
| Academic | subjects, subject_assignments, subject_marks_config, syllabus_topics, timetable, academic_calendar, holidays |
| Attendance & Marks | attendance, marks |
| Communication | notices, notice_reads |
| Content | notes, class_assignments, assignment_submissions |
| Projects | projects, project_teams, project_team_members, project_milestones |

### Key Relationships
```text
users ──────── students (1:1)
users ──────── faculty (1:1)
sessions ────── students (1:many)
subjects ────── subject_assignments (1:many)
faculty ─────── subject_assignments (1:many)
students ─────── attendance (1:many)
students ─────── marks (1:many)
subject_assignments ── notes (1:many)
subject_assignments ── class_assignments (1:many)
projects ────── project_teams (1:many)
project_teams ── project_team_members (1:many)
```

---

## 🎨 UI Design System

| Element | Value |
|---------|-------|
| Primary Navy | #1B3A6B |
| Primary Blue | #2563EB |
| Background | #F8FAFC |
| Success | #16A34A |
| Warning | #D97706 |
| Danger | #DC2626 |
| Heading Font | Plus Jakarta Sans |
| Mono Font | JetBrains Mono |
| Theme | Light (Dark mode toggle available) |

---

## 📸 Screenshots

> Screenshots will be added after
> final deployment.

| Screen | Description |
|--------|-------------|
| Login | Dual mode login (Faculty/Student) |
| HOD Dashboard | Department overview with charts |
| Faculty Attendance | Marking with calendar view |
| Marks Entry | MST1+MST2+Internal+Practical |
| AI Assignment | Question generation in action |
| Student Dashboard | Attendance alerts + deadlines |
| Project Milestones | Timeline with status tracking |

---

## 🔒 Security Features

- JWT based stateless authentication
- bcrypt password hashing (rounds: 10)
- Role based access control middleware
  (checkHOD, checkFaculty, checkStudent)
- All student routes are read-only
- HOD cannot access faculty passwords
- SQL injection prevented via
  parameterized queries
- File upload type and size validation
- Login activity logging
- Docker network isolation
  (DB not exposed to internet)

---

## 🐳 Docker Services

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| niist_postgres | postgres:15-alpine | 5432 | Database |
| niist_ollama | ollama/ollama:latest | 11434 | AI model runner |
| niist_ollama_pull | ollama/ollama:latest | - | Model downloader |
| niist_ai | python:3.11-slim | 8000 | AI microservice |
| niist_server | node:20-alpine | 5000 | Backend API |
| niist_client | node:20-alpine | 3000 | React frontend |

---

## 📊 Session Structure

The system manages 4 simultaneous
B.Tech batches:

| Session | Current Year | Semester | Project |
|---------|-------------|----------|---------|
| 2022-2026 | 4th Year (Final) | VII & VIII | ✅ Enabled |
| 2023-2027 | 3rd Year | V & VI | ✅ Enabled |
| 2024-2028 | 2nd Year | III & IV | ❌ Disabled |
| 2025-2029 | 1st Year | I & II | ❌ Disabled |

Each batch: ~150 students
Total: ~600 students

---

## 🤝 Contributing

This is a final year academic project
for NIIST, Bhopal.

If you find any issues or have
suggestions:

1. Fork the repository
2. Create your feature branch:
   `git checkout -b feature/improvement`
3. Commit your changes:
   `git commit -m 'Add improvement'`
4. Push to branch:
   `git push origin feature/improvement`
5. Open a Pull Request

---

## 🏫 College Information

| Field | Details |
|-------|---------|
| College | NRI Institute of Information Science & Technology |
| Short Name | NIIST |
| Location | 1 Sajjan Singh Nagar, Raisen Road, Bhopal, MP |
| University | RGPV (Rajiv Gandhi Proudyogiki Vishwavidyalaya) |
| Principal | Dr. Puran Gour |
| Department | Computer Science & Engineering |
| Branch Code | 0115CS |
| Website | https://www.nrigroupindia.com/NIIST |
| Contact | 0755-4085500 |
| Email | contactus@nrigroupindia.com |

---

## 📄 License

This project is built as a Final Year
Major Project for the Department of
Computer Science & Engineering,
NRI Institute of Information Science
& Technology (NIIST), Bhopal.

Affiliated to RGPV
(Rajiv Gandhi Proudyogiki Vishwavidyalaya)

Built with ❤️ for NIIST CSE Department

---

## 🙏 Acknowledgements

- **Dr. Puran Gour** — Principal, NIIST
- **RGPV University** — Academic framework
- **NRI Group of Institutions** — Support
- **Ollama** — Local AI model runner
- **Meta** — Llama 3.2 model
- **Tailwind CSS** — UI framework
- **Recharts** — Chart library

---

*NIIST Academia — Digitizing Academic
Operations for a Smarter Tomorrow* 🎓
