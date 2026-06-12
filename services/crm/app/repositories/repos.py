"""Entity-specific repository classes.

Each repository binds a SQLAlchemy model to the generic BaseRepository,
providing tenant-aware CRUD operations out of the box.
"""

import uuid

from sqlalchemy import func, select

from app.models import (
    Activity,
    Company,
    Contact,
    Deal,
    Note,
    Organization,
)
from app.repositories.base import BaseRepository


class OrganizationRepository(BaseRepository[Organization]):
    """Repository for Organization — not tenant-scoped (it is the tenant)."""

    model = Organization

    async def get_by_id(self, id_: uuid.UUID) -> Organization | None:  # type: ignore[override]
        """Override: Organization lookup is not scoped to an org."""
        result = await self.session.execute(
            select(Organization).where(
                Organization.id == id_, Organization.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def list_all(
        self, offset: int = 0, limit: int = 20
    ) -> tuple[list[Organization], int]:
        """List all organizations."""
        query = (
            select(Organization)
            .where(Organization.deleted_at.is_(None))
            .order_by(Organization.created_at.desc())
        )
        total_query = select(func.count()).select_from(
            select(Organization).where(Organization.deleted_at.is_(None)).subquery()
        )

        result = await self.session.execute(query.offset(offset).limit(limit))
        total = await self.session.scalar(total_query)
        return list(result.scalars().all()), total or 0


class ContactRepository(BaseRepository[Contact]):
    model = Contact

    def _searchable_fields(self) -> list[str]:
        return ["first_name", "last_name", "email"]


class CompanyRepository(BaseRepository[Company]):
    model = Company

    def _searchable_fields(self) -> list[str]:
        return ["name", "industry"]


class DealRepository(BaseRepository[Deal]):
    model = Deal

    def _searchable_fields(self) -> list[str]:
        return ["name"]


class ActivityRepository(BaseRepository[Activity]):
    model = Activity

    def _searchable_fields(self) -> list[str]:
        return ["subject", "description"]


class NoteRepository(BaseRepository[Note]):
    model = Note

    def _searchable_fields(self) -> list[str]:
        return ["content"]
