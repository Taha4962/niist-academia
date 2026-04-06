# NIIST Academia

**Comprehensive Academic Operations & Management System**  
*NRI Institute of Information Science and Technology, Bhopal (RGPV Affiliated) — CSE Department*

NIIST Academia is a full-stack educational platform built exclusively for streamlining college operations. It implements strict, hierarchical role-based access for HODs, Faculties, and Students while integrating a specialized, decoupled **AI Service** to unlock intelligent academic features.

---

## 🌟 Key Features by Role

| Role | Access & Capabilities |
|------|------------------------|
| **HOD (Head of Dept)** | Root access. Oversees all faculty subject assignments, academic calendar planning, global department pinned notices, and timetable publishing. |
| **Faculty** | Read-write access specific to assigned subjects. Uploads marks and daily attendance (time-gated to midnight), pushes class assignments/notes, monitors project milestones. |
| **Student** | Read-only access for consuming notices, personalized timetables, and academic marks. Upload privileges are strictly isolated to assignment and designated project module submissions. |

---

## 🏗️ Technical Architecture & Stack

The application is structured into decoupled, highly scalable components:

| Layer | Component | Description | Port |
|-------|-----------|-------------|------|
| **Frontend** | React.js + Vite | Responsive, fast client UI using Tailwind CSS and Lucide React icons. | `3000` |
| **Backend API** | Node.js + Express | RESTful server bridging database queries and enforcing stateless JWT auth. | `5000` |
| **Database** | PostgreSQL 15 | Relational DB maintaining 27 strict tables (No ORMs are used; native `pg` queries optimize complex relational logic). | `5432` |
| **AI Service** | Python FastAPI | Independent microservice querying the Groq Cloud API for academic intelligence securely. | `8000` |
| **Storage** | Cloudinary | Global asset storage for PDFs, documents, profile photos. | `N/A` |
| **LLM Engine** | Groq API | Utilizes `llama3-8b-8192` model for instantaneous, cloud-based inference. | `N/A` |

---

## 🚀 Quick Start (Local Run)

The repository provides a complete isolated network setup via Docker Compose.

```bash
# Clone the repository
git clone https://github.com/Taha4962/niist-academia.git
cd niist-academia

# Boot all backend, frontend, and database services
docker-compose up --build
```
*Note: Make sure to properly configure `.env` variables like `GROQ_API_KEY` and `CLOUDINARY_*` targeting your `.env.example` templates prior to startup. Local database seeding will automatically execute upon first Postgres initialization.*

---

## ☁️ Deployment (Cloud via Render)

This application is ready for scalable deployment on [Render](https://render.com) using the included `render.yaml` configuration.

1. **Database:** Deploy a managed PostgreSQL instance via Render or Supabase.
2. **Third-party Services:** Obtain API Keys from [Groq Console](https://console.groq.com/) and [Cloudinary](https://cloudinary.com).
3. **Render Blueprint:** From the Render Dashboard, connect this repository via **Blueprints**.
4. **Environment Configuration:** Render will prompt you for the required variables:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`
   - `GROQ_API_KEY`
   - `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`
   - `JWT_SECRET`, `VITE_API_URL`
5. **Auto-Deploy:** Render spins up the Node API, FastAPI, and Vite static site independently without Docker overhead. Because Render free databases expire after 90 days, we highly recommend connecting a permanent external DB.

---

## 🔑 Default Seeded Credentials

| Role | Login ID | Password |
|------|-----------|-----------|
| **HOD** | `hod@niist.ac.in` | `NIIST@HOD001` |
| **Faculty** | *Valid registered email* | `NIIST@{employee_id}` |
| **Student** | *Valid enrollment_no* | `NIIST@{last_4_digits}` |

---

## 📁 Repository Map

```
niist-academia/
├── client/          # React App (Axios, React-Router-Dom, Tailwind)
├── server/          # Express API (Mongoose-less Raw SQL logic, JWT Middleware)
├── ai-service/      # Python Microservice (FastAPI + Groq)
├── docker/          # Dockerfile configurations for local development
├── render.yaml      # Render blueprint integration
└── docker-compose.yml 
```

## ⚖️ License
Private — Developed for NIIST Bhopal, CSE Department.
