from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List, Optional
from app.dependencies import get_current_user
from app.services.storage_service import StorageService
from app.services.report_service import ReportService
from app.services.claim_service import ClaimService
from app.services.damage_service import DamageService
from app.services.cost_service import CostService
from app.services.fraud_service import FraudService
from app.services.decision_service import DecisionService
from app.services.vision_llm_service import VisionLLMService
from app.db.repositories.claim_repo import ClaimRepository
from app.db.repositories.cost_repo import CostRepository
from app.db.repositories.fraud_repo import FraudRepository
from app.schemas.claim import ClaimResponse, ClaimProcessResponse
from app.utils.constants import ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, MAX_IMAGES_PER_CLAIM
from app.utils.exceptions import ClaimNotFoundError, ClaimAlreadyProcessedError
from app.utils.logger import logger
from app.utils.scoring import compute_overall_severity_score

router = APIRouter(prefix="/claims", tags=["Claims"])


def _compute_damage_severity_score(damage_zones: list | None) -> Optional[int]:
    if not damage_zones:
        return None
    normalized = [zone for zone in damage_zones if isinstance(zone, dict)]
    if not normalized:
        return None
    return compute_overall_severity_score(normalized)


def _build_claim_service(claim_repo: ClaimRepository) -> ClaimService:
    """Build claim service dependencies from app state."""
    from app.main import ml_models

    if "yolo" not in ml_models:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="YOLO model is not loaded. Check YOLO_MODEL_PATH / YOLO_WEIGHTS_DIR configuration.",
        )

    clip_embedder = ml_models.get("clip")
    if clip_embedder is None:
        from app.ml.clip_embedder import CLIPEmbedder

        clip_embedder = CLIPEmbedder()  # creates instance with _available=False
        logger.warning("CLIP not loaded — fraud image similarity will be skipped.")

    damage_service = DamageService(detector=ml_models["yolo"])
    cost_service = CostService(cost_repo=CostRepository())
    fraud_service = FraudService(
        clip_embedder=clip_embedder,
        claim_repo=claim_repo,
        fraud_repo=FraudRepository(),
    )
    decision_service = DecisionService()
    vision_llm_service = VisionLLMService()

    return ClaimService(
        damage_service=damage_service,
        cost_service=cost_service,
        fraud_service=fraud_service,
        decision_service=decision_service,
        vision_llm_service=vision_llm_service,
        claim_repo=claim_repo,
    )


def _build_claim_response(claim: dict) -> ClaimResponse:
    """Convert DB row to API response."""
    import json

    damage_zones = claim.get("damage_json")
    if isinstance(damage_zones, str):
        damage_zones = json.loads(damage_zones)

    cost_breakdown = claim.get("cost_breakdown")
    if isinstance(cost_breakdown, str):
        cost_breakdown = json.loads(cost_breakdown)

    damage_severity_score = _compute_damage_severity_score(damage_zones)

    return ClaimResponse(
        id=str(claim["id"]),
        user_id=str(claim["user_id"]),
        image_urls=claim.get("image_urls", []),
        user_description=claim.get("user_description"),
        policy_number=claim.get("policy_number", ""),
        vehicle_company=claim.get("vehicle_company"),
        vehicle_model=claim.get("vehicle_model"),
        status=claim.get("status", "uploaded"),
        damage_zones=damage_zones,
        damage_severity_score=damage_severity_score,
        ai_explanation=claim.get("ai_explanation"),
        cost_breakdown=cost_breakdown,
        cost_total=claim.get("cost_total"),
        fraud_score=claim.get("fraud_score"),
        fraud_flags=claim.get("fraud_flags"),
        decision=claim.get("decision"),
        decision_confidence=claim.get("decision_confidence"),
        risk_level=claim.get("risk_level"),
        created_at=str(claim.get("created_at", "")),
        processed_at=str(claim.get("processed_at", "")) if claim.get("processed_at") else None,
    )


@router.post("", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def create_claim(
    images: List[UploadFile] = File(..., description="Vehicle damage images (JPG/PNG, max 5)"),
    policy_number: str = Form(...),
    vehicle_company: Optional[str] = Form(None),
    vehicle_model: Optional[str] = Form(None),
    user_description: Optional[str] = Form(None),
    incident_date: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    """Create and auto-process a claim with uploaded damage images."""
    # Validate image count
    if len(images) > MAX_IMAGES_PER_CLAIM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_IMAGES_PER_CLAIM} images allowed per claim.",
        )

    # Validate each file
    for img in images:
        if img.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {img.content_type}. Only JPG/PNG accepted.",
            )
        if img.size and img.size > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds {MAX_IMAGE_SIZE // (1024 * 1024)}MB limit.",
            )

    # Upload images to Supabase Storage
    storage = StorageService()
    image_urls = []
    for img in images:
        try:
            url = await storage.upload_image(file=img, user_id=current_user["id"])
            image_urls.append(url)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image upload failed: {str(e)}",
            )

    # Create claim record
    claim_repo = ClaimRepository()
    claim = await claim_repo.create(
        user_id=current_user["id"],
        image_urls=image_urls,
        policy_number=policy_number,
        vehicle_company=vehicle_company,
        vehicle_model=vehicle_model,
        user_description=user_description,
        incident_date=incident_date,
        location=location,
    )

    # Auto-process immediately after submission
    claim_service = _build_claim_service(claim_repo)

    try:
        processed = await claim_service.process_claim(
            claim["id"],
            current_user["id"],
            vehicle_company=vehicle_company,
            vehicle_model=vehicle_model,
        )
        return processed
    except Exception as e:
        logger.error(f"Auto-processing failed for claim {claim['id']}: {e}")
        latest = await claim_repo.get_by_id(claim["id"], current_user["id"])
        if latest:
            return _build_claim_response(latest)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Claim created but processing failed: {str(e)}",
        )


@router.get("", response_model=List[ClaimResponse])
async def list_claims(current_user: dict = Depends(get_current_user)):
    """List all claims for the authenticated user."""
    claim_repo = ClaimRepository()
    claims = await claim_repo.list_by_user(current_user["id"])
    return [_build_claim_response(c) for c in claims]


@router.get("/vehicle-options")
async def get_vehicle_options():
    """Return vehicle company/model dropdown values from pricing table."""
    options = await CostRepository().get_vehicle_options()
    return {
        "companies": sorted(options.keys()),
        "models_by_company": options,
    }


@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(
    claim_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get details of a specific claim."""
    claim_repo = ClaimRepository()
    claim = await claim_repo.get_by_id(claim_id, current_user["id"])
    if not claim:
        raise ClaimNotFoundError(claim_id)
    return _build_claim_response(claim)


@router.post("/{claim_id}/process", response_model=ClaimProcessResponse)
async def process_claim(
    claim_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Trigger the full AI processing pipeline for a claim."""
    # Check claim exists and is not already processed
    claim_repo = ClaimRepository()
    claim = await claim_repo.get_by_id(claim_id, current_user["id"])
    if not claim:
        raise ClaimNotFoundError(claim_id)
    if claim["status"] == "processed":
        raise ClaimAlreadyProcessedError(claim_id)
    if claim["status"] == "processing":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Claim is already being processed.",
        )

    claim_service = _build_claim_service(claim_repo)

    try:
        result = await claim_service.process_claim(claim_id, current_user["id"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Processing failed for claim {claim_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {str(e)}",
        )


@router.get("/{claim_id}/report")
async def download_report(
    claim_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Download PDF claim report."""
    claim_repo = ClaimRepository()
    claim = await claim_repo.get_by_id(claim_id, current_user["id"])
    if not claim:
        raise ClaimNotFoundError(claim_id)
    if claim["status"] != "processed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Claim must be processed before generating a report.",
        )

    report_service = ReportService()
    pdf_buffer = await report_service.generate_pdf(claim)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=ClaimIQ_Report_{claim_id[:8]}.pdf"
        },
    )


@router.delete("/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_claim(
    claim_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a claim."""
    claim_repo = ClaimRepository()
    deleted = await claim_repo.delete(claim_id, current_user["id"])
    if not deleted:
        raise ClaimNotFoundError(claim_id)
