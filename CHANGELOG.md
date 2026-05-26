# Changelog

All notable changes to the CRM SaaS project.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-05-26

### Added

- **Backend**: FastAPI REST API with async SQLAlchemy 2.0 and PostgreSQL
  - Multi-tenant architecture with organization-scoped data isolation
  - CRUD endpoints for Organizations, Contacts, Companies, Deals, Activities, Notes
  - Soft deletes via `deleted_at` timestamp
  - JWT authentication infrastructure (token creation, verification, password hashing)
  - Alembic database migrations with auto-generated revision support
  - Integration test suite (SQLite in-memory, 6 entity test modules)
  - Pagination and search support on all list endpoints
  - CORS middleware with configurable origins
  - Pydantic-settings for typed environment configuration
  - Health check endpoint at `/health`

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
  - Dashboard with summary cards and activity feed
  - Contacts: list, detail, create, edit with form validation
  - Companies: list, detail, create, edit
  - Deals: list, detail, create, edit with pipeline stage tracking
  - Activities: list, detail, create, edit with type categorization
  - Settings page with user preferences
  - Login and authentication pages
  - Dark/light theme support
  - Internationalization (English + Russian)
  - Sort-by functionality on list pages
  - React Query for server state management
  - Zustand for client state (auth, settings)
  - Component and integration tests (Vitest)

- **Infrastructure**: Docker-based deployment pipeline
  - Multi-stage backend Dockerfile (Python slim, non-root user)
  - Multi-stage frontend Dockerfile (Next.js standalone, non-root user)
  - Docker Compose for full-stack orchestration (PostgreSQL, Redis, Backend, Frontend)
  - Persistent volumes for PostgreSQL and Redis data
  - Health checks with proper startup ordering
  - Makefile for common operations (`up`, `down`, `logs`, `restart`, `reset`, `test`, `lint`)

- **CI/CD**: GitHub Actions workflow
  - Backend linting (Ruff format + lint + mypy type check)
  - Backend tests (Pytest with SQLite in-memory)
  - Frontend linting (ESLint + TypeScript type check)
  - Frontend tests (Vitest)
  - Docker build validation for both images

- **Documentation**:
  - Comprehensive README with architecture overview and quick start
  - .env.example with full variable documentation
  - Issue templates (bug report, feature request)
  - Pull request template
  - GitHub labels configuration
  - CHANGELOG.md
  - MIT License

[0.1.0]: https://github.com/app-company/crm-saas/releases/tag/v0.1.0
