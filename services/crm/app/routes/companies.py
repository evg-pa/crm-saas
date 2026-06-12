"""Company CRUD routes — tenant-scoped."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, pagination_params
from app.models import User
from app.repositories.repos import CompanyRepository
from app.schemas import (
    CompanyCreate,
    CompanyResponse,
    CompanyUpdate,
    PaginatedResponse,
)

router = APIRouter(tags=["Companies"])


def _repo(db: AsyncSession) -> CompanyRepository:
    return CompanyRepository(db)


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    body: CompanyCreate, db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompanyResponse:
    """Create a new company."""
    data = body.model_dump()
    data["organization_id"] = current_user.organization_id
    company = await _repo(db).create(**data)
    return CompanyResponse.model_validate(company)


@router.get("", response_model=PaginatedResponse)
async def list_companies(
    q: str | None = Query(default=None, description="Search across name and industry"),
    industry: str | None = Query(default=None, description="Filter by industry"),
    pagination: dict = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """List companies for the authenticated user's organization with optional search and filter."""
    items, total = await _repo(db).list(
        organization_id=current_user.organization_id,
        q=q,
        filters={"industry": industry},
        **pagination,
    )
    return {
        "total": total,
        "offset": pagination["offset"],
        "limit": pagination["limit"],
        "items": [CompanyResponse.model_validate(item) for item in items],
    }


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompanyResponse:
    """Get a company by ID."""
    company = await _repo(db).get_by_id(company_id, current_user.organization_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse.model_validate(company)


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: uuid.UUID,
    body: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompanyResponse:
    """Update a company."""
    company = await _repo(db).get_by_id(company_id, current_user.organization_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    updated = await _repo(db).update(company, **body.model_dump(exclude_unset=True))
    return CompanyResponse.model_validate(updated)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Soft-delete a company."""
    company = await _repo(db).get_by_id(company_id, current_user.organization_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    await _repo(db).delete(company)
