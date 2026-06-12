"""Organization CRUD routes.

POST   /organizations          — create
GET    /organizations          — list all
GET    /organizations/{id}     — get by ID
PATCH  /organizations/{id}     — update
DELETE /organizations/{id}     — soft-delete
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, pagination_params
from app.models import User
from app.repositories.repos import OrganizationRepository
from app.schemas import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
    PaginatedResponse,
)

router = APIRouter(tags=["Organizations"])


def _repo(db: AsyncSession) -> OrganizationRepository:
    return OrganizationRepository(db)


@router.post(
    "", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED
)
async def create_organization(
    body: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationResponse:
    """Create a new organization (tenant)."""
    org = await _repo(db).create(**body.model_dump())
    return OrganizationResponse.model_validate(org)


@router.get("", response_model=PaginatedResponse)
async def list_organizations(
    pagination: dict = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """List all organizations."""
    items, total = await _repo(db).list_all(**pagination)
    return {
        "total": total,
        "offset": pagination["offset"],
        "limit": pagination["limit"],
        "items": [OrganizationResponse.model_validate(item) for item in items],
    }


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationResponse:
    """Get an organization by ID."""
    org = await _repo(db).get_by_id(org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return OrganizationResponse.model_validate(org)


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: uuid.UUID,
    body: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationResponse:
    """Update an organization."""
    org = await _repo(db).get_by_id(org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    updated = await _repo(db).update(org, **body.model_dump(exclude_unset=True))
    return OrganizationResponse.model_validate(updated)


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Soft-delete an organization."""
    org = await _repo(db).get_by_id(org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    await _repo(db).delete(org)
