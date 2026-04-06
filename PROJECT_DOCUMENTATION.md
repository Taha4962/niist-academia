# NIIST Academia - Comprehensive Project Documentation

## 1. Project Overview
**NIIST Academia** is a full-stack, comprehensive Academic Operations and Management platform designed specifically for the NRI Institute of Information Science & Technology (CSE Department). It streamlines daily college operations by mapping strict role-based access for HODs, Faculties, Students, and Parents. It integrates standard academics (attendance, marks, syllabus tracking, projects, notices) with an isolated, locally-hosted **AI Service** powered by LLama models to provide intelligent academic features.

---

## 2. Technology Stack & Architecture
- **Frontend Container (`niist_client`):** React.js + Vite + TailwindCSS. Configured to run on `0.0.0.0:3000`.
- **Backend Container (`niist_server`):** Node.js + Express.js. Powers all REST APIs on `0.0.0.0:5000`. Uses native `pg` package for database queries (no ORM used).
- **Database Container (`niist_postgres`):** PostgreSQL 15. Hosted on port `5432`. Holds 27 relationally mapped tables.
- **AI Service Container (`niist_ai`):** Python + FastAPI. Hosted on `8000`.
- **LLM Engine (`niist_ollama` & `niist_ollama_pull`):** Local AI inference engine utilizing `llama3.2:3b` model to support the AI Service securely offline.
- **Orchestration:** Docker Compose coordinates the isolated networks, volumes, environment variables, and startup sequence of all 6 components.

---

## 3. Comprehensive Folder & File Structure

### 📁 Root Directory (`/niist-academia`)
- `docker-compose.yml`: The master configuration file. Wires the 6 services together safely using internal `niist_network`.
- `verification_report.md`: Historical structural check report noting the baseline health of the filesystem.

### 📁 Client (`/client`) - React Frontend
The complete user interface interacting with the backend APIs via Axios.
- `vite.config.js`: Vite server and build configuration. Set to poll dynamically for changes over Docker.
- `package.json`: Holds UI dependencies (`react`, `react-dom`, `axios`, `lucide-react`, `tailwindcss`, etc).
- `src/services/api.js`: Centralized Axios HTTP client configurations attaching JWT tokens securely to every outgoing request.
- `src/pages/hod/`: 
  - `NoticeBoard.jsx`: UI for the Head of Department to post, pin (max 3), edit, and track auto-notices for the whole department.
  - `ProjectOverview.jsx`: Grid-based UI overseeing all faculty-guided projects, team formations, and tracking missed milestones visually.
- `src/pages/faculty/`:
  - `Students.jsx`: Interactive catalog filtering students per subject, verifying parent contact numbers via modal, and mapping colored attendance badges.
- `src/pages/student/`:
  - `Timetable.jsx`: Renders the daily and weekly schedule matrix dynamically colored by subject groupings.

### 📁 Server (`/server`) - Node/Express Backend
The brain of the application controlling logic, handling auth, and interacting with PostgreSQL.
- `server.js`: The Express application entry point. Wires all 14 module routes together and attaches central error/404 handling.
- `package.json`: Holds Node dependencies (`express`, `pg`, `jsonwebtoken`, `bcrypt`, `cors`, `dotenv`, `multer`).
- `.env`: Vital environment mapping for HTTP ports, DB connection strings, and JWT hashing secrets.
- `config/db.js`: Initializes and exports the PostgreSQL connection pool using `pg`.
- `uploads/`: Directory preserved by `.gitkeep` meant to store physical user-uploaded materials (notes, assignments, profile pictures).
- **`/routes/`**: Define REST URL mappings to the controllers.
  - `authRoutes.js`: Maps `/login`, `/change-password`, `/me`.
  - `attendanceRoutes.js`: Maps bulk attendance submissions.
  - `marksRoutes.js`: Maps specific marks operations handling HOD verifications.
  - `noticeRoutes.js`: Secured routes for posting, pinning, and updating notices.
  - `holidayRoutes.js`: CRUD mapped endpoints for academic calendar holidays.
  - *(Other routes include: hod, faculty, student, assignment, notes, project, timetable, calendar, report).*
- **`/controllers/`**: Executes the heavy lifting and raw PostgreSQL logic.
  - `authController.js`: Compares bcrypted passwords, generates JWT tokens.
  - `attendanceController.js`: Logs presence and automatically triggers low-attendance notices via `createAutoNotice`.
  - `holidayController.js`: Executes `INSERT`/`DELETE` queries into the `holidays` table.
  - *(Other controllers manage logic identically matching their corresponding route names).*
- **`/middleware/`**: 
  - `authMiddleware.js`: Validates Bearer tokens on protected HTTP endpoints.
  - `roleMiddleware.js`: Contains `checkFaculty`, `checkHOD`, and `checkStudent` guarding routes from privilege escalation.
- **`/utils/`**:
  - `noticeHelper.js`: Standardized function (`createAutoNotice`) utilized by controllers to dispatch automatic system alerts securely.
- **`/db/`**:
  - `01_init.sql`: The master schema script mapped to `/docker-entrypoint-initdb.d/`. Creates all 27 tables cleanly in perfect foreign-key dependency order.
  - `02_seed.sql`: Injects all dummy and testing rows (Faculties, Sessions, Subjects, Time Slots) to grant a ready-to-test workspace.
- **`/models/`**: 13 JavaScript files existing as empty placeholders. Because the application evolved to utilize **raw SQL** querying heavily in the controllers to ensure complex relational speed, classic ORMs (Sequelize/Mongoose) are intentionally bypassed.

### 📁 AI Service (`/ai-service`) - Python FastAPI
A standalone container microservice designed solely to interface with the local LLama model without blocking the Node.js backend.
- *(Typically contains `main.py` routing the REST calls to Ollama and returning sanitized educational insights or prompts).*

### 📁 Docker Configs (`/docker`)
- `client.Dockerfile`, `server.Dockerfile`, `ai-service.Dockerfile`: Step-by-step OS level instructions to pull Alpine/Node images, `npm install`, and expose internal container ports.

---

## 4. Security & Role Features
- **JWT Authentication:** Stateful sessions are entirely avoided. Secure Bearer tokens determine identical boundaries via Express Middleware.
- **Privilege Separation:**
  - `Student`: Read-only for notices, timetable, marks, subjects. Upload privileges strictly isolated to assignment submissions.
  - `Faculty`: Read-write on attendance (time-gated to midnight), assignment creation, and marks uploads per assigned subject.
  - `HOD`: God-root access. Oversees all faculty subjects, creates sessions/calendars, adds holidays, and manages cross-department pinned notices.
- **Network Isolation:** PostgreSQL and Ollama instances are strictly sealed within the Docker bridge (`niist_network`). Only the web ports (3000, 5000, 8000) are exposed to the host machine.

---

## 5. Deployment & Boot Sequence
1. Docker kicks off creating the `niist_network` bridge.
2. `postgres` boots and executes `01_init.sql` followed by `02_seed.sql`. Container sets up `niist_user` and `niist_academia` DB.
3. `ollama` boots its raw engine. Right after, `ollama-pull` kicks in dynamically grabbing the 3B parameter model and gracefully exits.
4. `ai-service` boots referencing the Ollama dependency.
5. `server` (Node) starts on `5000` listening to the DB container health check before booting.
6. `client` (Vite) starts on `3000` serving the dynamic React assets directly mapping its `.env` REST endpoints to the host.
