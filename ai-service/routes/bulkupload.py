from fastapi import APIRouter, UploadFile, File
import shutil, os, json
from services.file_parser import parse_excel, parse_pdf
from services.ollama_service import ask_ollama

router = APIRouter()

@router.post('/upload')
async def bulk_upload(file: UploadFile = File(...)):
  temp_path = f'temp_{file.filename}'
  with open(temp_path, 'wb') as f:
    shutil.copyfileobj(file.file, f)
  try:
    if file.filename.endswith('.xlsx'):
      raw = parse_excel(temp_path)
      prompt = f"""
      Map these Excel rows to student records.
      Required fields: enrollment_no, name, phone,
      session (format: 2022-2026), semester.
      Optional fields: cgpa, dob, email, address,
      blood_group.
      Input data (first 3 rows as sample):
      {json.dumps(raw[:3], default=str)}
      Return ONLY a valid JSON array.
      No explanations. No markdown. Just JSON.
      """
    else:
      raw = parse_pdf(temp_path)
      prompt = f"""
      Extract student records from this text.
      Return ONLY a JSON array with these fields:
      enrollment_no, name, phone, session, semester.
      Optional: cgpa, dob, email.
      Text: {raw[:3000]}
      Return ONLY valid JSON. No explanations.
      """
    result = await ask_ollama(prompt)
    clean = result.strip()
    if '```' in clean:
      clean = clean.split('```')[1]
      if clean.startswith('json'):
        clean = clean[4:]
    students = json.loads(clean.strip())
    return {
      'success': True,
      'count': len(students),
      'students': students
    }
  except Exception as e:
    return {
      'success': False,
      'error': str(e),
      'students': []
    }
  finally:
    if os.path.exists(temp_path):
      os.remove(temp_path)
