from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    policy_type: Optional[str] = Field(
        None, pattern="^(comprehensive|third_party|own_damage)$"
    )


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    id: str
    name: str
    email: str
    access_token: str
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    policy_type: Optional[str] = None
    created_at: Optional[datetime] = None
