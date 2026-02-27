from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenRefreshRequest,
    AuthResponse,
    TokenResponse,
    UserProfile,
)
from app.db.repositories.user_repo import UserRepository
from app.dependencies import get_current_user
from app.utils.logger import logger
from app.config import settings
import httpx

router = APIRouter(prefix="/auth", tags=["Authentication"])

_GOTRUE_URL = f"{settings.SUPABASE_URL}/auth/v1"


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest):
    """Register a new user via Supabase Auth (direct HTTP)."""
    try:
        headers = {
            "apikey": settings.SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
        }
        payload = {
            "email": req.email,
            "password": req.password,
            "data": {"name": req.name, "role": "user"},
        }
        logger.info(f"Calling GoTrue signup for {req.email}")
        async with httpx.AsyncClient() as http:
            resp = await http.post(f"{_GOTRUE_URL}/signup", headers=headers, json=payload, timeout=30)

        if resp.status_code >= 400:
            body = resp.json()
            logger.error(f"GoTrue signup error {resp.status_code}: {body}")
            raise HTTPException(status_code=resp.status_code, detail=body.get("msg") or body.get("message") or str(body))

        data = resp.json()
        user_obj = data.get("user", {})
        user_id = user_obj.get("id")
        access_token = data.get("access_token", "")
        refresh_token = data.get("refresh_token", "")

        if not user_id:
            raise HTTPException(status_code=400, detail="Registration failed: no user ID in response")

        # Create user record in our users table
        user_repo = UserRepository()
        await user_repo.create(
            user_id=user_id,
            name=req.name,
            email=req.email,
            policy_type=req.policy_type,
        )

        logger.info(f"User registered: {req.email} (id={user_id})")

        return AuthResponse(
            id=user_id,
            name=req.name,
            email=req.email,
            access_token=access_token,
            refresh_token=refresh_token,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login(req: UserLoginRequest):
    """Login user via Supabase Auth (direct HTTP)."""
    try:
        headers = {
            "apikey": settings.SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient() as http:
            resp = await http.post(
                f"{_GOTRUE_URL}/token?grant_type=password",
                headers=headers,
                json={"email": req.email, "password": req.password},
                timeout=30,
            )

        if resp.status_code >= 400:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        data = resp.json()
        user_data = data.get("user", {})
        user_name = (user_data.get("user_metadata") or {}).get("name", "")

        return AuthResponse(
            id=user_data.get("id", ""),
            name=user_name,
            email=user_data.get("email", req.email),
            access_token=data.get("access_token", ""),
            refresh_token=data.get("refresh_token", ""),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(req: TokenRefreshRequest):
    """Refresh access token."""
    try:
        headers = {
            "apikey": settings.SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient() as http:
            resp = await http.post(
                f"{_GOTRUE_URL}/token?grant_type=refresh_token",
                headers=headers,
                json={"refresh_token": req.refresh_token},
                timeout=30,
            )

        if resp.status_code >= 400:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        data = resp.json()
        return TokenResponse(access_token=data.get("access_token", ""))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token refresh failed")


@router.get("/me", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    user_repo = UserRepository()
    user = await user_repo.get_by_id(current_user["id"])

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )

    return UserProfile(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        policy_type=user.get("policy_type"),
        created_at=user.get("created_at"),
    )
