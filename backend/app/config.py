from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # Vision LLM
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    VISION_LLM_MODEL: str = "gpt-4o"

    # ML Models
    YOLO_MODEL_PATH: Optional[str] = "../model/my_model.pt"
    YOLO_WEIGHTS_DIR: str = "../model/train/weights"

    # App
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


def resolve_yolo_model_path() -> str:
    """Resolve YOLO model path from explicit file path or fallback weights directory."""
    base_dir = Path(__file__).resolve().parents[1]  # backend/

    if settings.YOLO_MODEL_PATH:
        explicit_path = Path(settings.YOLO_MODEL_PATH)
        if not explicit_path.is_absolute():
            explicit_path = (base_dir / explicit_path).resolve()
        return str(explicit_path)

    weights_dir = Path(settings.YOLO_WEIGHTS_DIR)
    if not weights_dir.is_absolute():
        weights_dir = (base_dir / weights_dir).resolve()

    candidates = [
        weights_dir / "best.pt",
        weights_dir / "last.pt",
        *sorted(weights_dir.glob("*.pt")),
    ]

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return str(candidate)

    raise FileNotFoundError(
        "No YOLO model weights found. Expected YOLO_MODEL_PATH (default: ../model/my_model.pt) "
        "or any .pt file in YOLO_WEIGHTS_DIR (default: ../model/train/weights)."
    )
