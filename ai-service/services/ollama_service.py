import httpx, os
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama3-8b-8192"

async def ask_ollama(prompt: str) -> str:
    try:
        if not GROQ_API_KEY:
            return "AI Error: GROQ_API_KEY missing"
            
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        return f'AI Error: {str(e)}'
