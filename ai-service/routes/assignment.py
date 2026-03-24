from fastapi import APIRouter
from pydantic import BaseModel
from services.ollama_service import ask_ollama

router = APIRouter()

class AssignmentRequest(BaseModel):
  subject_name: str
  unit_no: int
  topic: str
  difficulty: str
  count: int = 5

@router.post('/generate')
async def generate_questions(req: AssignmentRequest):
  prompt = f"""
  You are a university professor.
  Generate exactly {req.count} assignment
  questions for {req.subject_name}
  Unit {req.unit_no} on topic: {req.topic}.
  Difficulty level: {req.difficulty}.
  Return ONLY a numbered list of questions.
  No explanations, no extra text.
  Format: 1. question text
  """
  result = await ask_ollama(prompt)
  lines = result.strip().split('\n')
  questions = [
    line.strip() for line in lines
    if line.strip() and
    line.strip()[0].isdigit()
  ]
  return {
    'questions': questions,
    'subject': req.subject_name,
    'unit': req.unit_no,
    'topic': req.topic,
    'difficulty': req.difficulty
  }
