"""Activity CRUD routes — tenant-scoped."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, pagination_params
from app.models import User
from app.repositories.repos import ActivityRepository
from app.schemas import (
    ActivityCreate,
    ActivityResponse,
    ActivityUpdate,
    PaginatedResponse,
)

router = APIRouter(tags=["Activities"])


def _repo(db: AsyncSession) -> ActivityRepository:
    return ActivityRepository(db)


@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(
    body: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ActivityResponse:
    """Create a new activity."""
    data = body.model_dump()
    data["organization_id"] = current_user.organization_id
    activity = await _repo(db).create(**data)
    return ActivityResponse.model_validate(activity)


@router.get("", response_model=PaginatedResponse)
async def list_activities(
    q: str | None = Query(
        default=None, description="Search across subject and description"
    ),
    activity_type: str | None = Query(
        default=None, description="Filter by activity type"
    ),
    contact_id: uuid.UUID | None = Query(default=None, description="Filter by contact"),
    deal_id: uuid.UUID | None = Query(default=None, description="Filter by deal"),
    pagination: dict = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """List activities for the authenticated user's organization with optional search and filters."""
    items, total = await _repo(db).list(
        organization_id=current_user.organization_id,
        q=q,
        filters={
            "activity_type": activity_type,
            "contact_id": contact_id,
            "deal_id": deal_id,
        },
        **pagination,
    )
    return {
        "total": total,
        "offset": pagination["offset"],
        "limit": pagination["limit"],
        "items": [ActivityResponse.model_validate(item) for item in items],
    }


@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ActivityResponse:
    """Get an activity by ID."""
    activity = await _repo(db).get_by_id(activity_id, current_user.organization_id)
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return ActivityResponse.model_validate(activity)


@router.patch("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: uuid.UUID,
    body: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ActivityResponse:
    """Update an activity."""
    activity = await _repo(db).get_by_id(activity_id, current_user.organization_id)
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    updated = await _repo(db).update(activity, **body.model_dump(exclude_unset=True))
    return ActivityResponse.model_validate(updated)


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Soft-delete an activity."""
    activity = await _repo(db).get_by_id(activity_id, current_user.organization_id)
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    await _repo(db).delete(activity)
