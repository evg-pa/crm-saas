"""User management CRUD routes — tenant-scoped and role-gated.

GET    /api/v1/users          — list users in current org (paginated, searchable)
GET    /api/v1/users/{id}     — get user detail
PATCH  /api/v1/users/{id}     — update user (name, role, is_active)
DELETE /api/v1/users/{id}     — soft-delete user

Role-based protection:
- Only admin users may change another user's role or is_active flag.
- Only admin users may soft-delete another user.
- Users can always update their own full_name, but not their own role or is_active.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, pagination_params
from app.models import User
from app.repositories.repos import UserRepository
from app.schemas import (
    MessageResponse,
    PaginatedResponse,
    UserResponse,
    UserUpdate,
)

router = APIRouter(tags=["Users"])

ADMIN_ROLE = "admin"


def _repo(db: AsyncSession) -> UserRepository:
    return UserRepository(db)


def _require_admin(
    current_user: User,
    target_user_id: uuid.UUID | None = None,
    action: str = "perform this action",
) -> None:
    """Raise 403 if current_user is not an admin."""
    if current_user.role != ADMIN_ROLE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only {ADMIN_ROLE} users can {action}",
        )


@router.get("", response_model=PaginatedResponse)
async def list_users(
    q: str | None = Query(default=None, description="Search across full_name and email"),
    pagination: dict = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """List users in the authenticated user's organization with optional search."""
    items, total = await _repo(db).list(
        organization_id=current_user.organization_id, q=q, **pagination
    )
    return {
        "total": total,
        "offset": pagination["offset"],
        "limit": pagination["limit"],
        "items": [UserResponse.model_validate(item) for item in items],
    }


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get a user by ID (must belong to the same organization)."""
    user = await _repo(db).get_by_id(user_id, current_user.organization_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Update a user's name, role, or is_active flag.

    Role-based rules:
    - Admin users can update any field on any user in the same org.
    - Non-admin users can only update their own full_name.
    """
    target = await _repo(db).get_by_id(user_id, current_user.organization_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")

    updates = body.model_dump(exclude_unset=True)
    is_self = target.id == current_user.id

    # Determine if any privileged fields are being changed
    privileged_fields_changed = bool(
        ("role" in updates and updates["role"] != target.role)
        or ("is_active" in updates and updates["is_active"] != target.is_active)
    )

    if current_user.role != ADMIN_ROLE:
        if not is_self:
            # Non-admin trying to update another user
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own profile",
            )
        # Non-admin updating themselves: strip privileged fields
        if privileged_fields_changed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can change role or is_active",
            )
        # Allow self name update only
        if "full_name" not in updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updatable fields provided",
            )

    updated = await _repo(db).update(target, **updates)
    return UserResponse.model_validate(updated)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Soft-delete a user. Only admin users may delete users."""
    target = await _repo(db).get_by_id(user_id, current_user.organization_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")

    if target.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot delete your own account",
        )

    _require_admin(current_user, action="delete users")

    await _repo(db).delete(target)
    return {"message": "User deleted successfully"}
