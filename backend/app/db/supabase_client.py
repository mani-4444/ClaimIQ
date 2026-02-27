from supabase import create_client, Client
from app.config import settings
import httpx

_client: Client | None = None


def get_supabase_client() -> Client:
    """Get or create Supabase client singleton."""
    global _client
    if _client is None:
        _client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_ANON_KEY,
        )
    return _client


def get_supabase_auth_client() -> Client:
    """Get Supabase client using anon key (for auth operations)."""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY,
    )


# Direct HTTP helpers for Supabase GoTrue Auth API
_AUTH_URL = f"{settings.SUPABASE_URL}/auth/v1"
_AUTH_HEADERS = {
    "apikey": settings.SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
}


async def supabase_auth_sign_up(email: str, password: str, user_metadata: dict | None = None) -> dict:
    """Sign up via direct HTTP to Supabase GoTrue."""
    payload = {"email": email, "password": password}
    if user_metadata:
        payload["data"] = user_metadata
    async with httpx.AsyncClient() as client:
        r = await client.post(f"{_AUTH_URL}/signup", headers=_AUTH_HEADERS, json=payload, timeout=30)
    r.raise_for_status()
    return r.json()


async def supabase_auth_sign_in(email: str, password: str) -> dict:
    """Sign in via direct HTTP to Supabase GoTrue."""
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{_AUTH_URL}/token?grant_type=password",
            headers=_AUTH_HEADERS,
            json={"email": email, "password": password},
            timeout=30,
        )
    r.raise_for_status()
    return r.json()


async def supabase_auth_refresh(refresh_token: str) -> dict:
    """Refresh token via direct HTTP to Supabase GoTrue."""
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{_AUTH_URL}/token?grant_type=refresh_token",
            headers=_AUTH_HEADERS,
            json={"refresh_token": refresh_token},
            timeout=30,
        )
    r.raise_for_status()
    return r.json()


async def supabase_auth_get_user(access_token: str) -> dict:
    """Get user by access token via direct HTTP to Supabase GoTrue."""
    headers = {**_AUTH_HEADERS, "Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{_AUTH_URL}/user", headers=headers, timeout=15)
    r.raise_for_status()
    return r.json()
