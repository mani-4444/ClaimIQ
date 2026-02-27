from fastapi import APIRouter, HTTPException, status, Depends
from app.db.repositories.analytics_repo import AnalyticsRepository
from app.dependencies import get_current_user
from app.utils.logger import logger

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
async def analytics_summary(current_user: dict = Depends(get_current_user)):
    """
    Return real aggregated metrics from the claims table.

    Response:
        {
            "total_claims": int,
            "approved_claims": int,
            "rejected_claims": int,
            "manual_review_claims": int,
            "high_fraud_cases": int,
            "avg_claim_cost": float
        }
    """
    try:
        repo = AnalyticsRepository()
        summary = await repo.get_summary()
        return summary
    except Exception as e:
        logger.error(f"Analytics summary failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analytics: {str(e)}",
        )
