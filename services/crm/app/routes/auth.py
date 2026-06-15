"""Authentication routes — register, login, and refresh with JWT Bearer tokens.

POST /api/v1/auth/register  — create user + organization
POST /api/v1/auth/login     — authenticate and return tokens
POST /api/v1/auth/refresh   — rotate refresh token for new access+refresh pair
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models import Organization, RefreshToken, User
from app.schemas import (
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)) -> dict:
    """Register a new user and create their organization."""
    # Check if email already taken
    result = await db.execute(
        select(User).where(User.email == body.email, User.deleted_at.is_(None))
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    # Check if slug already taken
    result = await db.execute(
        select(Organization).where(
            Organization.slug == body.organization_slug,
            Organization.deleted_at.is_(None),
        )
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An organization with this slug already exists",
        )

    # Create organization
    org = Organization(name=body.organization_name, slug=body.organization_slug)
    db.add(org)
    await db.flush()

    # Create user
    user = User(
        organization_id=org.id,
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
        email_verified=False,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    # Issue tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token_str, jti = create_refresh_token(data={"sub": str(user.id)})

    # Persist refresh token row
    db.add(
        RefreshToken(
            user_id=user.id,
            token_jti=jti,
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.jwt_refresh_token_expire_minutes),
        )
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "organization_id": org.id,
        "user": UserResponse.model_validate(user),
        "refresh_token": refresh_token_str,
    }


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)) -> dict:
    """Authenticate a user and return a JWT access token."""
    result = await db.execute(
        select(User).where(User.email == body.email, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token_str, jti = create_refresh_token(data={"sub": str(user.id)})

    # Persist refresh token row
    db.add(
        RefreshToken(
            user_id=user.id,
            token_jti=jti,
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.jwt_refresh_token_expire_minutes),
        )
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "organization_id": user.organization_id,
        "user": UserResponse.model_validate(user),
        "refresh_token": refresh_token_str,
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshTokenRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """Rotate a refresh token — issue new access + refresh token pair.

    The old refresh token is single-use and is invalidated (used_at set).
    """
    # Decode and validate the refresh token
    try:
        payload = decode_refresh_token(body.refresh_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id_str: str | None = payload.get("sub")
    jti: str | None = payload.get("jti")
    if not user_id_str or not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token: missing claims",
        )

    # Look up the stored token record
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_jti == jti,
            RefreshToken.used_at.is_(None),
        )
    )
    stored_token = result.scalar_one_or_none()

    if stored_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token already used or not found",
        )

    # Check if the token is expired (belt and suspenders — JWT expiry already checked)
    expires_at = stored_token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    # Look up the user
    result = await db.execute(
        select(User).where(
            User.id == stored_token.user_id,
            User.deleted_at.is_(None),
        )
    )
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Mark the old token as used (single-use rotation)
    stored_token.used_at = datetime.now(timezone.utc)

    # Issue new token pair
    access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token_str, new_jti = create_refresh_token(data={"sub": str(user.id)})

    # Persist new refresh token
    db.add(
        RefreshToken(
            user_id=user.id,
            token_jti=new_jti,
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.jwt_refresh_token_expire_minutes),
        )
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "organization_id": user.organization_id,
        "user": UserResponse.model_validate(user),
        "refresh_token": new_refresh_token_str,
    }
