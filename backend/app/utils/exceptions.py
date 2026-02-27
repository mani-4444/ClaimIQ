from fastapi import HTTPException, status


class ClaimNotFoundError(HTTPException):
    def __init__(self, claim_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim {claim_id} not found",
        )


class ClaimAlreadyProcessedError(HTTPException):
    def __init__(self, claim_id: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Claim {claim_id} has already been processed",
        )


class ClaimProcessingError(HTTPException):
    def __init__(self, claim_id: str, detail: str = "Processing failed"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Claim {claim_id}: {detail}",
        )


class InvalidImageError(HTTPException):
    def __init__(self, detail: str = "Invalid image file"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


class MLModelError(HTTPException):
    def __init__(self, model_name: str, detail: str):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML model '{model_name}' error: {detail}",
        )


class RateLimitExceededError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )
