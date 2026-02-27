from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenRefreshRequest,
    AuthResponse,
    TokenResponse,
    UserProfile,
)
from app.db.supabase_client import get_supabase_client
from app.db.repositories.user_repo import UserRepository
from app.dependencies import get_current_user
from app.utils.logger import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest):
    """Register a new user via Supabase Auth."""
    try:
        client = get_supabase_client()

        # Create auth user in Supabase
        auth_response = client.auth.sign_up(
            {
                "email": req.email,
                "password": req.password,
                "options": {
                    "data": {
                        "name": req.name,
                        "role": "user",
                    }
                },
            }
        )

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed",
            )

        # Create user record in our users table
        user_repo = UserRepository()
        await user_repo.create(
            user_id=auth_response.user.id,
            name=req.name,
            email=req.email,
            policy_type=req.policy_type,
        )

        logger.info(f"User registered: {req.email}")

        return AuthResponse(
            id=auth_response.user.id,
            name=req.name,
            email=req.email,
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/login", response_model=AuthResponse)
async def login(req: UserLoginRequest):
    """Login user via Supabase Auth."""
    try:
        client = get_supabase_client()

        auth_response = client.auth.sign_in_with_password(
            {"email": req.email, "password": req.password}
        )

        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        user_name = (auth_response.user.user_metadata or {}).get("name", "")

        return AuthResponse(
            id=auth_response.user.id,
            name=user_name,
            email=auth_response.user.email,
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(req: TokenRefreshRequest):
    """Refresh access token."""
    try:
        client = get_supabase_client()
        response = client.auth.refresh_session(req.refresh_token)

        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        return TokenResponse(access_token=response.session.access_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed",
        )


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
