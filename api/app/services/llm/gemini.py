import httpx

from app.core.config import settings
from app.services.llm.base import LLMClient

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


class GeminiClient(LLMClient):
    async def generate(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GEMINI_URL,
                params={"key": settings.GEMINI_API_KEY},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "maxOutputTokens": 512,
                        "temperature": 0.7,
                    },
                },
            )
            response.raise_for_status()
            return response.json()["candidates"][0]["content"]["parts"][0]["text"]
