# NIIST Academia
> A production-grade, full-stack academic management and AI-assisted educational platform for modern computing departments.

## 📌 Problem Statement
Traditional academic management relies heavily on fragmented spreadsheets and isolated databases. This leads to delayed attendance tracking, disjointed communication, and significant administrative overhead. Furthermore, generating customized, curriculum-aligned assessments is incredibly time-consuming for faculty members.

## 💡 Solution Overview
NIIST Academia is a highly scalable college management system designed to unify departmental operations for the NRI Institute of Information Science and Technology. It provides role-specific dashboards, automated attendance and performance monitoring, embedded AI tools, and strict role-based access control, all orchestrated over a containerized microservices architecture.

## 👥 Who Uses This System
* **Students**: Gain real-time visibility into their academic standing (attendance, marks, specific timetables), retrieve automated notices, and seamlessly manage B.Tech project deliverables.
* **Faculty**: Utilize streamlined attendance entry (time-gated), review automated shortage flagging, manage project milestones, and leverage AI-assisted assessment creation specific to their assigned subjects.
* **Head of Department (HOD)**: Root access for calendar planning, faculty assignments, global department pinned notices, timetable publishing, and macroscopic decision-making capabilities.

## ✨ Key Technical Features
* **Role-Based Access Control (RBAC)**: Deeply enforced zero-trust architecture across all API routes via explicit `roleMiddleware.js` for HODs, Faculty, and Students.
* **Automated Notice Actions**: Event-driven communications triggered by critical system and academic events (e.g., automated low-attendance warnings).
* **Project & Milestone Tracking**: Dedicated, state-driven workflows for B.Tech project team formation, guide allocation, and ongoing milestone evaluation.
* **Raw SQL Performance**: Completely bypassed traditional ORMs (Mongoose/Sequelize) in favor of raw `pg` bindings to maximize query speed across 27 normalized relational tables.

## 🧠 AI Service Microservice
The platform utilizes a decoupled AI architecture orchestrated via Python and FastAPI:
* **Hybrid Deployment Option**: For local development, it operates on a CPU-bound **Ollama (Llama 3.2)** instance with zero cloud dependencies ensuring optimal privacy. For cloud deployments (Render), it seamlessly falls back to the **Groq Cloud API**.
* **Asynchronous Execution**: Fully decoupled from the main Node.js event loop, preventing heavy LLM inferences from blocking concurrent academic REST requests.

## 🏗 System Architecture & Tech Stack
The ecosystem employs a robust multi-container architecture via Docker Compose:
* **Frontend (`client`)**: React.js SPA powered by Vite and TailwindCSS for a highly responsive, optimal UX.
* **Core API (`server`)**: Node.js and Express backend handling authentication, complex relational business logic, and stateless JWT sessions.
* **AI Intelligence (`ai-service`)**: Python FastAPI backend structuring prompts and returning sanitized, intelligent completions.
* **Data Persistence (`database`)**: PostgreSQL 15 operating as the strictly 3NF normalized single source of truth.

## 📂 Repository Structure
```text
niist-academia/
├── client/          # React SPA (Vite, Tailwind, Axios)
├── server/          # Node.js API (Raw SQL, JWT Middleware, Controllers)
├── ai-service/      # Python FastAPI (Local LLM & Groq orchestration)
├── docker/          # Isolated Dockerfiles for development
├── render.yaml      # Render blueprint integration for cloud
└── docker-compose.yml # Master orchestration for local ecosystem
```

## 🚀 Quick Start (Local Docker Setup)

**Prerequisites**: Docker, Docker Compose, and Git.

```bash
# 1. Clone the repository
git clone https://github.com/Taha4962/niist-academia.git
cd niist-academia

# 2. Configure variables based on the template
cp .env.example .env

# 3. Boot the isolated container ecosystem
docker-compose up --build -d

# Accessible Endpoints:
# Frontend UI: http://localhost:3000
# API Backend: http://localhost:5000
# AI Service: http://localhost:8000
```
*Note: The PostgreSQL database (`5432`) is automatically seeded with faculties, subjects, and timetables via initialization scripts on the very first boot.*

## ☁️ Cloud Deployment
This application is fully decoupled and optimized for scalable cloud deployment via [Render](https://render.com) using the included `render.yaml`. 
1. Supply PostgreSQL, Cloudinary, and Groq API variables in the dashboard.
2. The blueprint natively spins up the Node API, FastAPI, and statically serves the Vite site devoid of Docker overhead.

## 🔑 Default Seeded Credentials
| Role | Login ID | Password |
|------|-----------|-----------|
| **HOD** | `hod@niist.ac.in` | `NIIST@HOD001` |
| **Faculty** | *(Valid registered email)* | `NIIST@{employee_id}` |
| **Student** | *(Valid enrollment_no)* | `NIIST@{last_4_digits}` |

## ⚖️ License
Private — Developed specifically for NIIST Bhopal, CSE Department.
