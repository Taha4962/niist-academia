# NIIST Academia

**Smart Academic Management System**
NRI Institute of Information Science and Technology, Bhopal
(RGPV Affiliated) — CSE Department

## Tech Stack

| Layer       | Technology                        | Port  |
|-------------|-----------------------------------|-------|
| Frontend    | React.js + Vite + Tailwind CSS    | 3000  |
| Backend     | Node.js + Express.js              | 5000  |
| Database    | PostgreSQL 15                     | 5432  |
| AI Service  | Python FastAPI                    | 8000  |
| AI Runner   | Ollama + Llama 3.2 3B (CPU only)  | 11434 |

## Quick Start

```bash
# Clone and start everything
docker-compose up --build

# Wait for Ollama to download the model (first run only)
# Check logs: docker logs niist_ollama_pull -f
```

## Default Credentials

| Role    | Login ID           | Password         |
|---------|--------------------|------------------|
| HOD     | hod@niist.ac.in    | NIIST@HOD001     |
| Faculty | email              | NIIST@{emp_id}   |
| Student | enrollment_no      | NIIST@{last4}    |

## Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **AI Service**: http://localhost:8000
- **API Health**: http://localhost:5000/api/health
- **AI Health**: http://localhost:8000/health

## Project Structure

```
niist-academia/
├── client/          # React + Vite frontend
├── server/          # Express.js backend
├── ai-service/      # Python FastAPI + Ollama
├── docker/          # Dockerfiles
└── docker-compose.yml
```

## License

Private — NIIST Bhopal, CSE Department
