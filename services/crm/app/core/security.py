"""JWT authentication and password hashing utilities."""

import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext  # type: ignore[import-untyped]
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a plain-text password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    jti = str(uuid.uuid4())
    to_encode.update({"iat": now, "exp": expire, "type": "access", "jti": jti})
    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> tuple[str, str]:
    """Create a signed JWT refresh token.

    Returns (encoded_token, jti) — the jti is stored in DB for single-use tracking.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta
        or timedelta(minutes=settings.jwt_refresh_token_expire_minutes)
    )
    jti = str(uuid.uuid4())
    to_encode.update({"iat": now, "exp": expire, "type": "refresh", "jti": jti})
    token = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return token, jti


def decode_refresh_token(token: str) -> dict:
    """Decode and validate a JWT refresh token (must have type=refresh)."""
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Token is not a refresh token")
    return payload


PASSWORD_RESET_PURPOSE = "password_reset"
PASSWORD_RESET_EXPIRE_MINUTES = 15

EMAIL_VERIFY_PURPOSE = "email_verify"
EMAIL_VERIFY_EXPIRE_HOURS = 24


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )


def create_password_reset_token(user_id: str) -> str:
    """Create a short-lived JWT for password reset (15 min expiry).

    Includes an ``iat`` (issued-at) claim so the reset-password endpoint
    can detect reused tokens by comparing against the user's
    ``password_changed_at`` timestamp.
    """
    now = datetime.now(timezone.utc)
    return create_access_token(
        data={
            "sub": user_id,
            "purpose": PASSWORD_RESET_PURPOSE,
            "iat": now,
        },
        expires_delta=timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES),
    )


def decode_password_reset_token(token: str) -> dict:
    """Decode and validate a password-reset JWT. Raises on expiry/signature error."""
    payload = decode_access_token(token)
    if payload.get("purpose") != PASSWORD_RESET_PURPOSE:
        raise jwt.InvalidTokenError("Token has wrong purpose")
    return payload


def create_email_verification_token(user_id: str) -> str:
    """Create a JWT for email verification (24h expiry).

    Includes an ``iat`` (issued-at) claim so the verify-email endpoint
    can detect reused tokens by comparing against the user's
    ``email_verified_at`` timestamp.
    """
    now = datetime.now(timezone.utc)
    return create_access_token(
        data={
            "sub": user_id,
            "purpose": EMAIL_VERIFY_PURPOSE,
            "iat": now,
        },
        expires_delta=timedelta(hours=EMAIL_VERIFY_EXPIRE_HOURS),
    )


def decode_email_verification_token(token: str) -> dict:
    """Decode and validate an email-verification JWT. Raises on expiry/signature error."""
    payload = decode_access_token(token)
    if payload.get("purpose") != EMAIL_VERIFY_PURPOSE:
        raise jwt.InvalidTokenError("Token has wrong purpose")
    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Extract and validate Bearer token, return the authenticated User.

    Raises 401 if the token is missing, expired, or the user is not found.
    """
    from app.models import User  # noqa: F811 (lazy import to avoid circular)

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
        user_id = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user
