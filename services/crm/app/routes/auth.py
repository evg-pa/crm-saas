"""Authentication routes — register, login, refresh, forgot-password, reset-password with JWT Bearer tokens.

POST /api/v1/auth/register         — create user + organization
POST /api/v1/auth/login            — authenticate and return tokens
POST /api/v1/auth/refresh          — rotate refresh token for new access+refresh pair
POST /api/v1/auth/forgot-password  — request password reset token
POST /api/v1/auth/reset-password   — reset password with token
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    create_refresh_token,
    decode_email_verification_token,
    decode_password_reset_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models import Organization, RefreshToken, User
from app.schemas import (
    ForgotPasswordRequest,
    MessageResponse,
    RefreshTokenRequest,
    ResetPasswordRequest,
    SendVerificationRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    VerifyEmailRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Auth"])


@router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
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
    """Authenticate a user and return a JWT access + refresh token pair."""
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

    # Optionally require email verification before login (config-driven)
    if settings.require_email_verification and not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox for a verification link.",
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
async def refresh(
    body: RefreshTokenRequest, db: AsyncSession = Depends(get_db)
) -> dict:
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


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
async def forgot_password(
    body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    """Request a password reset token. Always returns 200 to prevent email enumeration."""
    result = await db.execute(
        select(User).where(
            User.email == body.email,
            User.deleted_at.is_(None),
            User.is_active == True,
        )
    )
    user = result.scalar_one_or_none()

    if user is not None:
        token = create_password_reset_token(str(user.id))
        logger.info("Password reset token generated for user_id=%s", user.id)

    return {"message": "If the email exists, a password reset link has been sent"}


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
async def reset_password(
    body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    """Reset a user's password using a valid, unused reset token."""
    # Decode and validate the token
    try:
        payload = decode_password_reset_token(body.token)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token",
        )

    user_id_str: str | None = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token: missing subject",
        )

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token: malformed subject",
        )

    # Fetch user
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found or inactive",
        )

    # Enforce single-use: if password was changed AFTER the token was issued, reject
    token_iat = payload.get("iat")
    if token_iat is not None:
        token_issued_at = datetime.fromtimestamp(token_iat, tz=timezone.utc)
        # Treat NULL password_changed_at (never reset) as epoch — always before any token
        pw_changed_raw = (
            user.password_changed_at
            if user.password_changed_at is not None
            else datetime(1970, 1, 1, tzinfo=timezone.utc)
        )
        # SQLite stores naive datetimes; attach UTC before comparison
        pw_changed = pw_changed_raw.replace(tzinfo=timezone.utc)
        if pw_changed > token_issued_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token has already been used",
            )

    # Update password
    user.hashed_password = hash_password(body.new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    await db.flush()

    return {"message": "Password reset successfully"}
