"""
Test fixtures for CRM integration tests.

Uses SQLite in-memory database (idempotent, no external deps).
Overrides FastAPI's get_db and get_current_user dependencies for test auth.
"""

import asyncio
import logging
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import get_current_user, hash_password
from app.main import app
from app.models import Organization, User

# Shared in-memory SQLite URL — cache=shared allows multiple connections
TEST_DATABASE_URL = "sqlite+aiosqlite:///file:testdb?mode=memory&cache=shared&uri=true"

# Each test module gets a unique DB to avoid collisions
_engine = None
_session_factory = None

@pytest.fixture(autouse=True)
def _set_caplog_level(caplog):
    """Ensure caplog captures INFO-level messages (needed for password-reset logs)."""
    caplog.set_level(logging.INFO)


# Test user credentials — seeded once per session
TEST_USER_EMAIL = "test@crm.test"
TEST_USER_PASSWORD = "testpass123"
TEST_ORG_NAME = "TestOrg"
TEST_ORG_SLUG = "test-org"


@pytest_asyncio.fixture(scope="session")
def event_loop():
    """Create a single event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine():
    """Create a shared SQLite engine for the test session."""
    global _engine
    _engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    await _engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def session_factory(engine):
    """Create a session factory bound to the test engine."""
    global _session_factory
    _session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    return _session_factory


@pytest_asyncio.fixture
async def db_session(session_factory) -> AsyncGenerator[AsyncSession, None]:
    """Provide an isolated database session with rollback after each test.

    Uses savepoint-based cleanup for speed — no table drops between tests.
    """
    async with session_factory() as session:
        async with session.begin():
            yield session
            await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client with test DB override and authenticated test user.

    Creates a test organization + user, then overrides both get_db and
    get_current_user so all requests are automatically authenticated.
    """

    async def override_get_db():
        yield db_session

    # Seed test organization and user
    org = Organization(
        id=uuid.uuid4(),
        name=TEST_ORG_NAME,
        slug=TEST_ORG_SLUG,
    )
    db_session.add(org)
    await db_session.flush()

    test_user = User(
        id=uuid.uuid4(),
        organization_id=org.id,
        email=TEST_USER_EMAIL,
        hashed_password=hash_password(TEST_USER_PASSWORD),
        full_name="Test User",
        is_active=True,
    )
    db_session.add(test_user)
    await db_session.flush()

    async def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_org_id(client) -> str:
    """Return the ID of the auto-created test organization.

    Depends on client so the org is seeded first.
    Returns a str for easy comparison with JSON responses.
    """
    # The org was created in the client fixture and the override is active,
    # so we fetch it via the API.
    resp = await client.get("/api/v1/organizations")
    items = resp.json()["items"]
    return items[0]["id"]


@pytest_asyncio.fixture
async def test_user_id(client, test_org_id) -> str:
    """Return the user ID of the auto-created test user."""
    return str(test_org_id)  # user's org_id is the org we just fetched
