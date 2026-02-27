import io
import httpx
import numpy as np
from PIL import Image
from typing import List
from app.utils.logger import logger


class CLIPEmbedder:
    """Generate image embeddings using OpenAI CLIP ViT-B/32."""

    def __init__(self):
        try:
            import torch
            import clip

            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
            self.torch = torch
            self._available = True
            logger.info(f"CLIP model loaded on {self.device}")
        except Exception as e:
            logger.warning(f"CLIP model not available: {e}. Fraud image similarity disabled.")
            self._available = False

    @property
    def is_available(self) -> bool:
        return self._available

    async def get_embedding(self, image_url: str) -> List[float]:
        """Generate CLIP embedding for an image URL."""
        if not self._available:
            logger.warning("CLIP not available, returning empty embedding")
            return [0.0] * 512

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(image_url)
            resp.raise_for_status()

        image = Image.open(io.BytesIO(resp.content)).convert("RGB")
        image_input = self.preprocess(image).unsqueeze(0).to(self.device)

        with self.torch.no_grad():
            embedding = self.model.encode_image(image_input)
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)

        return embedding.cpu().numpy().flatten().tolist()
