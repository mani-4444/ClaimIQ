from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.v1.router import router as v1_router
from app.middleware.error_handler import global_exception_handler
from app.middleware.rate_limiter import RateLimitMiddleware
from app.config import settings
from app.utils.logger import logger

# Global ML model instances (loaded once at startup)
ml_models: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup, cleanup on shutdown."""
    logger.info("Starting ClaimIQ backend...")

    # Load YOLO model
    try:
        from app.ml.yolo_detector import YOLODetector
        ml_models["yolo"] = YOLODetector()
    except Exception as e:
        logger.warning(f"YOLO model failed to load: {e}. Damage detection will be unavailable.")

    # Load CLIP model
    try:
        from app.ml.clip_embedder import CLIPEmbedder
        ml_models["clip"] = CLIPEmbedder()
    except Exception as e:
        logger.warning(f"CLIP model failed to load: {e}. Fraud image similarity will be unavailable.")

    logger.info(f"ML models loaded: {list(ml_models.keys())}")

    yield

    logger.info("Shutting down ClaimIQ backend...")
    ml_models.clear()


app = FastAPI(
    title="ClaimIQ API",
    description="AI-Powered Instant Motor Claim Pre-Approval System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)

# Global error handler
app.add_exception_handler(Exception, global_exception_handler)

# Register API routes
app.include_router(v1_router)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "models_loaded": list(ml_models.keys()),
        "version": "1.0.0",
    }
