"""Reusable FastAPI dependencies.

Provides database session, pagination helpers, and auth dependency.
"""

from typing import Annotated

from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user  # noqa: F401

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def pagination_params(
    offset: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        default=20, ge=1, le=100, description="Maximum number of records to return"
    ),
) -> dict[str, int]:
    """Extract pagination parameters from query string."""
    return {"offset": offset, "limit": limit}
