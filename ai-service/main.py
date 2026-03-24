from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import assignment, bulkupload, attendance

app = FastAPI(
  title='NIIST Academia AI Service',
  description='Local AI — Ollama Llama 3.2 3B',
  version='1.0.0'
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=['*'],
  allow_methods=['*'],
  allow_headers=['*'],
)

app.include_router(assignment.router, prefix='/ai/assignment', tags=['Assignment Generator'])
app.include_router(bulkupload.router, prefix='/ai/bulk', tags=['Bulk Upload'])
app.include_router(attendance.router, prefix='/ai/attendance', tags=['Attendance Alerts'])

@app.get('/health')
def health_check():
  return {
    'status': 'ok',
    'app': 'NIIST Academia AI Service',
    'model': 'llama3.2:3b',
    'runner': 'ollama',
    'college': 'NIIST Bhopal',
    'university': 'RGPV'
  }
