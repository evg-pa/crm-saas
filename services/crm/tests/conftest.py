"""
Test fixtures for CRM integration tests.

Uses SQLite in-memory database (idempotent, no external deps).
Overrides FastAPI's get_db dependency to use the test engine.
"""

import asyncio
from typing import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app

# Shared in-memory SQLite URL — cache=shared allows multiple connections
TEST_DATABASE_URL = "sqlite+aiosqlite:///file:testdb?mode=memory&cache=shared&uri=true"

# Each test module gets a unique DB to avoid collisions
_engine = None
_session_factory = None


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
    """Async HTTP client pointed at the FastAPI app with test DB override."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
