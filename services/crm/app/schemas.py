"""Pydantic request/response schemas for CRM entities.

All request schemas support partial updates via Optional fields.
All response schemas use UUIDs and ISO-format datetimes.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ── Mixins ──────────────────────────────────────────────────────────────────


class TimestampMixin(BaseModel):
    """Add created_at / updated_at to response schemas."""

    created_at: datetime
    updated_at: datetime


class PaginatedResponse(BaseModel):
    """Wrapper for paginated list responses."""

    total: int
    offset: int
    limit: int
    items: list


# ── Organization ────────────────────────────────────────────────────────────


class OrganizationBase(BaseModel):
    """Fields shared by all Organization operations."""

    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")


class OrganizationCreate(OrganizationBase):
    """Body for POST /organizations."""


class OrganizationUpdate(BaseModel):
    """Body for PATCH /organizations/{id}. All fields optional."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")


class OrganizationResponse(OrganizationBase, TimestampMixin):
    """Read response for Organization."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


# ── Contact ─────────────────────────────────────────────────────────────────


class ContactBase(BaseModel):
    """Fields shared by all Contact operations."""

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    title: str | None = Field(default=None, max_length=200)
    company_id: uuid.UUID | None = None


class ContactCreate(ContactBase):
    """Body for POST /contacts."""

    organization_id: uuid.UUID


class ContactUpdate(BaseModel):
    """Body for PATCH /contacts/{id}. All fields optional."""

    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    title: str | None = Field(default=None, max_length=200)
    company_id: uuid.UUID | None = None


class ContactResponse(ContactBase, TimestampMixin):
    """Read response for Contact."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID


# ── Company ─────────────────────────────────────────────────────────────────


class CompanyBase(BaseModel):
    """Fields shared by all Company operations."""

    name: str = Field(..., min_length=1, max_length=255)
    website: str | None = Field(default=None, max_length=500)
    industry: str | None = Field(default=None, max_length=200)
    size: int | None = Field(default=None, ge=0)
    address: str | None = None


class CompanyCreate(CompanyBase):
    """Body for POST /companies."""

    organization_id: uuid.UUID


class CompanyUpdate(BaseModel):
    """Body for PATCH /companies/{id}. All fields optional."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    website: str | None = Field(default=None, max_length=500)
    industry: str | None = Field(default=None, max_length=200)
    size: int | None = Field(default=None, ge=0)
    address: str | None = None


class CompanyResponse(CompanyBase, TimestampMixin):
    """Read response for Company."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID


# ── Deal ────────────────────────────────────────────────────────────────────


class DealBase(BaseModel):
    """Fields shared by all Deal operations."""

    name: str = Field(..., min_length=1, max_length=255)
    amount: int | None = Field(default=None, ge=0)
    stage: str = Field(default="new", min_length=1, max_length=50)
    contact_id: uuid.UUID | None = None
    company_id: uuid.UUID | None = None
    expected_close_date: datetime | None = None


class DealCreate(DealBase):
    """Body for POST /deals."""

    organization_id: uuid.UUID


class DealUpdate(BaseModel):
    """Body for PATCH /deals/{id}. All fields optional."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    amount: int | None = Field(default=None, ge=0)
    stage: str | None = Field(default=None, min_length=1, max_length=50)
    contact_id: uuid.UUID | None = None
    company_id: uuid.UUID | None = None
    expected_close_date: datetime | None = None


class DealResponse(DealBase, TimestampMixin):
    """Read response for Deal."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID


# ── Activity ────────────────────────────────────────────────────────────────


class ActivityBase(BaseModel):
    """Fields shared by all Activity operations."""

    activity_type: str = Field(..., min_length=1, max_length=50)
    subject: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    contact_id: uuid.UUID | None = None
    deal_id: uuid.UUID | None = None
    occurred_at: datetime


class ActivityCreate(ActivityBase):
    """Body for POST /activities."""

    organization_id: uuid.UUID


class ActivityUpdate(BaseModel):
    """Body for PATCH /activities/{id}. All fields optional."""

    activity_type: str | None = Field(default=None, min_length=1, max_length=50)
    subject: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    contact_id: uuid.UUID | None = None
    deal_id: uuid.UUID | None = None
    occurred_at: datetime | None = None


class ActivityResponse(ActivityBase, TimestampMixin):
    """Read response for Activity."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID


# ── Note ────────────────────────────────────────────────────────────────────


class NoteBase(BaseModel):
    """Fields shared by all Note operations."""

    content: str = Field(..., min_length=1)


class NoteCreate(NoteBase):
    """Body for POST /notes."""

    organization_id: uuid.UUID
    contact_id: uuid.UUID


class NoteUpdate(BaseModel):
    """Body for PATCH /notes/{id}. All fields optional."""

    content: str | None = Field(default=None, min_length=1)


class NoteResponse(NoteBase, TimestampMixin):
    """Read response for Note."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    contact_id: uuid.UUID
