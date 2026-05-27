"""Note CRUD routes — tenant-scoped."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import pagination_params
from app.repositories.repos import NoteRepository
from app.schemas import (
    NoteCreate,
    NoteResponse,
    NoteUpdate,
    PaginatedResponse,
)

router = APIRouter(tags=["Notes"])


def _repo(db: AsyncSession) -> NoteRepository:
    return NoteRepository(db)


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    body: NoteCreate, db: AsyncSession = Depends(get_db)
) -> NoteResponse:
    """Create a new note."""
    note = await _repo(db).create(**body.model_dump())
    return NoteResponse.model_validate(note)


@router.get("", response_model=PaginatedResponse)
async def list_notes(
    organization_id: uuid.UUID = Query(..., description="Tenant organization ID"),
    q: str | None = Query(default=None, description="Search note content"),
    contact_id: uuid.UUID | None = Query(default=None, description="Filter by contact"),
    pagination: dict = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List notes for the given organization with optional search and filter."""
    items, total = await _repo(db).list(
        organization_id=organization_id,
        q=q,
        filters={"contact_id": contact_id},
        **pagination,
    )
    return {
        "total": total,
        "offset": pagination["offset"],
        "limit": pagination["limit"],
        "items": [NoteResponse.model_validate(item) for item in items],
    }


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Tenant organization ID"),
    db: AsyncSession = Depends(get_db),
) -> NoteResponse:
    """Get a note by ID."""
    note = await _repo(db).get_by_id(note_id, organization_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteResponse.model_validate(note)


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: uuid.UUID,
    body: NoteUpdate,
    organization_id: uuid.UUID = Query(..., description="Tenant organization ID"),
    db: AsyncSession = Depends(get_db),
) -> NoteResponse:
    """Update a note."""
    note = await _repo(db).get_by_id(note_id, organization_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    updated = await _repo(db).update(note, **body.model_dump(exclude_unset=True))
    return NoteResponse.model_validate(updated)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Tenant organization ID"),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete a note."""
    note = await _repo(db).get_by_id(note_id, organization_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    await _repo(db).delete(note)
