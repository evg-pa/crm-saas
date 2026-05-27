"""Seed script — creates a default demo organization for local development.

Usage:
    cd services/crm
    python scripts/seed.py

Requires a running PostgreSQL database with tables already created (alembic upgrade head).
"""

import asyncio
import uuid
from sqlalchemy import text
from app.core.database import async_session_factory

DEMO_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEMO_ORG_NAME = "Demo Organization"
DEMO_ORG_SLUG = "demo"


async def seed() -> None:
    async with async_session_factory() as session:
        # Check if demo org already exists
        result = await session.execute(
            text("SELECT 1 FROM organizations WHERE id = :id"),
            {"id": DEMO_ORG_ID},
        )
        if result.scalar() is not None:
            print(f"Demo organization already exists (id={DEMO_ORG_ID})")
            print(f"Auth store: set orgId to '{DEMO_ORG_ID}'")
            return

        # Create demo organization
        await session.execute(
            text(
                "INSERT INTO organizations (id, name, slug) VALUES (:id, :name, :slug)"
            ),
            {"id": DEMO_ORG_ID, "name": DEMO_ORG_NAME, "slug": DEMO_ORG_SLUG},
        )
        await session.commit()
        print(f"Created demo organization: {DEMO_ORG_NAME} (id={DEMO_ORG_ID})")
        print("\nTo use in the frontend, set auth store with:")
        print(f"  orgId: '{DEMO_ORG_ID}'")
        print("  token: 'demo-token' (any non-empty value works for dev)")


if __name__ == "__main__":
    asyncio.run(seed())
