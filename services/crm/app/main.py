"""
CRM Backend — FastAPI application entry point.

Starts the uvicorn server and registers all route modules.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import (
    activities,
    companies,
    contacts,
    deals,
    notes,
    organizations,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown events."""
    from app.core.database import engine

    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="CRM Backend API — contacts, companies, deals, activities, notes",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with API version prefix
app.include_router(organizations.router, prefix="/api/v1/organizations")
app.include_router(contacts.router, prefix="/api/v1/contacts")
app.include_router(companies.router, prefix="/api/v1/companies")
app.include_router(deals.router, prefix="/api/v1/deals")
app.include_router(activities.router, prefix="/api/v1/activities")
app.include_router(notes.router, prefix="/api/v1/notes")


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok", "version": settings.app_version}
