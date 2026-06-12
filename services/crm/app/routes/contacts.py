"""Contact CRUD routes — tenant-scoped.

POST   /contacts          — create
GET    /contacts          — list (filtered by organization_id)
GET    /contacts/{id}     — get by ID
PATCH  /contacts/{id}     — update
DELETE /contacts/{id}     — soft-delete
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, pagination_params
from app.models import User
from app.repositories.repos import ContactRepository
from app.schemas import (
    ContactCreate,
    ContactResponse,
    ContactUpdate,
    PaginatedResponse,
)

router = APIRouter(tags=["Contacts"])


def _repo(db: AsyncSession) -> ContactRepository:
    return ContactRepository(db)


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    body: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContactResponse:
    """Create a new contact."""
    data = body.model_dump()
    data["organization_id"] = current_user.organization_id
    contact = await _repo(db).create(**data)
    return ContactResponse.model_validate(contact)


@router.get("", response_model=PaginatedResponse)
async def list_contacts(
    q: str | None = Query(default=None, description="Search across name and email"),
    pagination: dict = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """List contacts for the authenticated user's organization with optional search."""
    items, total = await _repo(db).list(
        organization_id=current_user.organization_id, q=q, **pagination
    )
    return {
        "total": total,
        "offset": pagination["offset"],
        "limit": pagination["limit"],
        "items": [ContactResponse.model_validate(item) for item in items],
    }


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContactResponse:
    """Get a contact by ID."""
    contact = await _repo(db).get_by_id(contact_id, current_user.organization_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return ContactResponse.model_validate(contact)


@router.patch("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: uuid.UUID,
    body: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContactResponse:
    """Update a contact."""
    contact = await _repo(db).get_by_id(contact_id, current_user.organization_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    updated = await _repo(db).update(contact, **body.model_dump(exclude_unset=True))
    return ContactResponse.model_validate(updated)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Soft-delete a contact."""
    contact = await _repo(db).get_by_id(contact_id, current_user.organization_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    await _repo(db).delete(contact)
