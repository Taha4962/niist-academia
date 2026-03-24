import httpx, os
from dotenv import load_dotenv
load_dotenv()

OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://ollama:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2:3b')

async def ask_ollama(prompt: str) -> str:
  try:
    async with httpx.AsyncClient(timeout=120.0) as client:
      response = await client.post(
        f'{OLLAMA_BASE_URL}/api/generate',
        json={
          'model': OLLAMA_MODEL,
          'prompt': prompt,
          'stream': False
        }
      )
      data = response.json()
      return data.get('response', '')
  except Exception as e:
    return f'AI Error: {str(e)}'
