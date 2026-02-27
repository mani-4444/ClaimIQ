from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.claims import router as claims_router
from app.api.v1.analytics import router as analytics_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router)
router.include_router(claims_router)
router.include_router(analytics_router)
