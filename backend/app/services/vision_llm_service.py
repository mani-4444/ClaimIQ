import httpx
from typing import List, Optional
from app.config import settings
from app.schemas.damage import DamageZone
from app.utils.logger import logger


class VisionLLMService:
    """Generate natural language damage explanation using Vision LLM."""

    SYSTEM_PROMPT = (
        "You are an expert automotive damage assessor for an insurance company. "
        "Given a vehicle damage image and detected damage data, provide a concise "
        "professional assessment. Include: damage description, likely cause, "
        "repair recommendation. Keep response under 150 words. Be factual and precise."
    )

    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.model = settings.VISION_LLM_MODEL

    async def explain_damage(
        self,
        image_urls: List[str],
        damage_zones: List[DamageZone],
        user_description: Optional[str] = None,
    ) -> str:
        """Generate AI explanation of detected damage."""
        zones_summary = ", ".join(
            f"{d.zone} ({d.severity}, {d.confidence:.0%})" for d in damage_zones
        )

        user_prompt = (
            f"Analyze this vehicle damage image.\n\n"
            f"Detected damage zones: {zones_summary}\n"
            f"{'User description: ' + user_description if user_description else ''}\n\n"
            f"Provide a professional damage assessment."
        )

        try:
            if self.openai_key and ("gpt" in self.model or "openai" in self.model):
                return await self._call_openai(image_urls[0], user_prompt)
            elif self.gemini_key:
                return await self._call_gemini(image_urls[0], user_prompt)
            else:
                logger.warning("No Vision LLM API key configured, using fallback")
                return self._fallback_explanation(damage_zones)
        except Exception as e:
            logger.error(f"Vision LLM failed: {e}")
            return self._fallback_explanation(damage_zones)

    async def _call_openai(self, image_url: str, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.openai_key}"},
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": self.SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": {"url": image_url}},
                            ],
                        },
                    ],
                    "max_tokens": 300,
                },
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    async def _call_gemini(self, image_url: str, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{self.model}:generateContent?key={self.gemini_key}",
                json={
                    "contents": [
                        {
                            "parts": [
                                {"text": f"{self.SYSTEM_PROMPT}\n\n{prompt}"},
                                {
                                    "inline_data": {
                                        "mime_type": "image/jpeg",
                                        "file_uri": image_url,
                                    }
                                },
                            ]
                        }
                    ]
                },
            )
            response.raise_for_status()
            return response.json()["candidates"][0]["content"]["parts"][0]["text"]

    def _fallback_explanation(self, damage_zones: List[DamageZone]) -> str:
        """Template-based fallback when LLM is unavailable."""
        if not damage_zones:
            return "No significant damage detected. Manual inspection recommended."

        zones_text = ", ".join(
            f"{d.zone} ({d.severity} damage, {d.confidence:.0%} confidence)"
            for d in damage_zones
        )

        severity_max = max(
            (d.severity for d in damage_zones),
            key=lambda s: ["minor", "moderate", "severe"].index(s),
        )

        repair_note = (
            "Immediate repair recommended."
            if severity_max == "severe"
            else "Standard repair procedures applicable."
        )

        return (
            f"Vehicle damage assessment: Detected damage in {zones_text}. "
            f"Overall severity is classified as {severity_max}. {repair_note}"
        )
