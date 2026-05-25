"""Deal CRUD routes — tenant-scoped."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import pagination_params
from app.repositories.repos import DealRepository
from app.schemas import (
    DealCreate,
    DealResponse,
    DealUpdate,
    PaginatedResponse,
)

router = APIRouter(tags=["Deals"])


def _repo(db: AsyncSession) -> DealRepository:
    return DealRepository(db)


@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
async def create_deal(
    body: DealCreate, db: AsyncSession = Depends(get_db)
) -> DealResponse:
    """Create a new deal."""
    deal = await _repo(db).create(**body.model_dump())
    return DealResponse.model_validate(deal)


@router.get("", response_model=PaginatedResponse)
async def list_deals(
    organization_id: uuid.UUID = Query(..., description="Tenant organization ID"),
    q: str | None = Query(default=None, description="Search across deal name"),
    stage: str | None = Query(default=None, description="Filter by deal stage"),
    contact_id: uuid.UUID | None = Query(default=None, description="Filter by contact"),
    company_id: uuid.UUID | None = Query(default=None, description="Filter by company"),
    pagination: dict = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List deals for the given organization with optional search and filters."""
    items, total = await _repo(db).list(
        organization_id=organization_id,
        q=q,
        filters={"stage": stage, "contact_id": contact_id, "company_id": company_id},
        **pagination
    )
    return {
        "total": total,
        "offset": pagination["offset"],
        "limit": pagination["limit"],
        "items": [DealResponse.model_validate(item) for item in items],
    }


@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Tenant organization ID"),
    db: AsyncSession = Depends(get_db),
) -> DealResponse:
    """Get a deal by ID."""
    deal = await _repo(db).get_by_id(deal_id, organization_id)
    if deal is None:
        raise HTTPException(status_code=404, detail="Deal not found")
    return DealResponse.model_validate(deal)


@router.patch("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: uuid.UUID,
    body: DealUpdate,
    organization_id: uuid.UUID = Query(..., description="Tenant organization ID"),
    db: AsyncSession = Depends(get_db),
) -> DealResponse:
    """Update a deal."""
    deal = await _repo(db).get_by_id(deal_id, organization_id)
    if deal is None:
        raise HTTPException(status_code=404, detail="Deal not found")
    updated = await _repo(db).update(deal, **body.model_dump(exclude_unset=True))
    return DealResponse.model_validate(updated)


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deal(
    deal_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Tenant organization ID"),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete a deal."""
    deal = await _repo(db).get_by_id(deal_id, organization_id)
    if deal is None:
        raise HTTPException(status_code=404, detail="Deal not found")
    await _repo(db).delete(deal)
