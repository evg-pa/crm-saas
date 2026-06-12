"""Generic async CRUD repository.

Provides a typed, reusable BaseRepository[T] with soft-delete support,
multi-tenant org scoping, text search, and field-level filtering.
"""

import uuid
from typing import Any, Generic, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """Typed CRUD repository for SQLAlchemy ORM models.

    All list/get operations are automatically scoped to an organization_id
    and exclude soft-deleted records.
    """

    model: type[T]  # type: ignore[assignment]

    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self) -> Select:  # type: ignore[type-var]
        """Return a base select query excluding soft-deleted records."""
        return select(self.model).where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]

    def _searchable_fields(self) -> list[str]:
        """Return list of column names to search via the `q` parameter.

        Override in subclasses to enable text search.
        """
        return []

    async def list(
        self,
        organization_id: uuid.UUID,
        offset: int = 0,
        limit: int = 20,
        q: str | None = None,
        filters: dict[str, Any] | None = None,
    ) -> tuple[list[T], int]:
        """List records for an organization with pagination, search, and filters."""
        query = self._base_query().where(self.model.organization_id == organization_id)  # type: ignore[attr-defined]

        # Apply text search across searchable fields (case-insensitive partial match)
        if q:
            search_clauses = []
            for field_name in self._searchable_fields():
                col = getattr(self.model, field_name, None)
                if col is not None:
                    search_clauses.append(col.ilike(f"%{q}%"))
            if search_clauses:
                from sqlalchemy import or_

                query = query.where(or_(*search_clauses))

        # Apply explicit field filters
        if filters:
            for field_name, value in filters.items():
                if value is not None:
                    col = getattr(self.model, field_name, None)
                    if col is not None:
                        query = query.where(col == value)

        query = query.order_by(self.model.created_at.desc())  # type: ignore[attr-defined]

        # Build a matching count query from the same base
        count_query = (
            select(func.count())
            .select_from(self.model)
            .where(self.model.organization_id == organization_id)  # type: ignore[attr-defined]
            .where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]
        )
        if q:
            search_clauses = []
            for field_name in self._searchable_fields():
                col = getattr(self.model, field_name, None)
                if col is not None:
                    search_clauses.append(col.ilike(f"%{q}%"))
            if search_clauses:
                from sqlalchemy import or_

                count_query = count_query.where(or_(*search_clauses))
        if filters:
            for field_name, value in filters.items():
                if value is not None:
                    col = getattr(self.model, field_name, None)
                    if col is not None:
                        count_query = count_query.where(col == value)

        result = await self.session.execute(query.offset(offset).limit(limit))
        total = await self.session.scalar(count_query)
        return list(result.scalars().all()), total or 0

    async def get_by_id(self, id_: uuid.UUID, organization_id: uuid.UUID) -> T | None:
        """Get a single record by ID, scoped to organization."""
        result = await self.session.execute(
            self._base_query().where(
                self.model.id == id_,  # type: ignore[attr-defined]
                self.model.organization_id == organization_id,  # type: ignore[attr-defined]
            )
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs: Any) -> T:
        """Create a new record."""
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def update(self, instance: T, **kwargs: Any) -> T:
        """Update fields on an existing instance."""
        for key, value in kwargs.items():
            if value is not None:
                setattr(instance, key, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def delete(self, instance: T) -> T:
        """Soft-delete a record by setting deleted_at."""
        from app.models import utcnow

        instance.deleted_at = utcnow()  # type: ignore[attr-defined]
        await self.session.flush()
        return instance
