# CRM SaaS

Open-source Customer Relationship Management (CRM) system built with FastAPI and Next.js. Designed for small to medium businesses to manage contacts, companies, deals, and activities.

[![CI](https://github.com/evg-pa/crm-saas/actions/workflows/ci.yml/badge.svg)](https://github.com/evg-pa/crm-saas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-brightgreen.svg)](CHANGELOG.md)

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Docker Usage](#docker-usage)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Default Credentials](#default-credentials)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture

```
┌──────────────────────┐     ┌──────────────────────┐
│   Next.js Frontend   │────▶│   FastAPI Backend     │
│   (port 3000)        │     │   (port 8000)         │
│                      │     │                       │
│  - React 19          │     │  - Async SQLAlchemy   │
│  - Tailwind CSS      │     │  - Pydantic v2        │
│  - shadcn/ui         │     │  - JWT Auth           │
└──────────────────────┘     └──────────┬───────────┘
                                        │
                         ┌──────────────┼──────────────┐
                         │              │              │
                  ┌──────▼──────┐ ┌─────▼──────┐
                  │ PostgreSQL  │ │   Redis    │
                  │  (port 5432)│ │ (port 6379)│
                  └─────────────┘ └────────────┘
```

All services run in Docker containers orchestrated by Docker Compose. The Next.js frontend proxies API requests to the FastAPI backend. PostgreSQL stores all persistent data. Redis is reserved for caching and session management.

### Key Design Decisions

- **Multi-tenant by organization** — data is isolated via `organization_id`, not separate databases
- **Soft deletes** — records are never hard-deleted; a `deleted_at` timestamp marks deletion
- **Async throughout** — asyncpg for non-blocking database access, httpx for tests
- **Standalone Next.js output** — production frontend runs as a self-contained Node.js server
- **Non-root containers** — both backend and frontend Docker images run as non-root users
- **Health checks** — all services have health checks with proper startup ordering

---

## Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend    | FastAPI (Python 3.12), SQLAlchemy 2.0 (async), Pydantic v2 |
| Database   | PostgreSQL 16                                           |
| Cache      | Redis 7                                                 |
| Auth       | JWT (bcrypt + PyJWT)                                    |
| Testing    | Pytest (backend), Vitest + Playwright (frontend)        |
| Linting    | Ruff + mypy (backend), ESLint + Prettier (frontend)     |
| DevOps     | Docker, Docker Compose, GitHub Actions CI               |

---

|## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 27+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.29+
- (Optional) [Node.js](https://nodejs.org/) 22+ and [pnpm](https://pnpm.io/) 9+ for local dev
- (Optional) [Python](https://www.python.org/) 3.12+ for local backend dev

### One-Command Start

```bash
# 1. Clone the repository
git clone https://github.com/evg-pa/crm-saas.git
cd crm-saas

# 2. Configure environment
cp .env.example .env

# 3. Start everything
docker compose up --build
```

Wait 20–30 seconds for all services to become healthy (migrations run automatically).

Once all containers are healthy:

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000         |
| Backend  | http://localhost:8000         |
| Swagger  | http://localhost:8000/docs    |
| ReDoc    | http://localhost:8000/redoc   |

> **Note:** The first time you open the frontend, it auto-registers a dev user
> (`dev@crm.local` / `devpass123`) and immediately logs you in. No manual
> registration is needed for local development.

### Verify It Works

```bash
# 1. Health check (no auth required)
curl http://localhost:8000/health
# → {"status": "ok", "version": "0.1.0"}

# 2. Register a user (creates an organization automatically)
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "mypassword",
    "full_name": "Demo User",
    "organization_name": "My Organization",
    "organization_slug": "my-org"
  }'
# → Returns JWT access_token, refresh_token, and user info

# 3. Or login with the auto-created dev user
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@crm.local","password":"devpass123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 4. Use the token for authenticated API calls
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/contacts?limit=5
# → {"total": 0, "items": []}

# 5. Create a contact
curl -X POST http://localhost:8000/api/v1/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"first_name":"Jane","last_name":"Doe","email":"jane@example.com"}'
```

> **Important:** All CRUD endpoints require a JWT Bearer token. The
> frontend handles this automatically — the curl examples above show
> the manual flow for API-first usage.

---

## Docker Usage

### Makefile Commands

```bash
make up         # Start all services
make down       # Stop all services
make logs       # Tail logs from all containers
make restart    # Restart all services
make reset      # Tear down volumes and rebuild from scratch
make backend    # Start only backend + DB + Redis
make frontend   # Start only frontend (requires backend running)
make test       # Run all tests
make lint       # Run all linters
```

### Services

| Service    | Container Name | Port  | Volume        |
|------------|---------------|-------|---------------|
| PostgreSQL | crm-db        | 5432  | `pgdata`      |
| Redis      | crm-redis     | 6379  | `redisdata`   |
| Backend    | crm-backend   | 8000  | (none)        |
| Frontend   | crm-frontend  | 3000  | (none)        |

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Resetting Everything

```bash
make reset
# This destroys all volumes and rebuilds from scratch.
# All data will be lost.
```

---

## Development Workflow

### Backend (FastAPI)

```bash
cd services/crm

# Create virtualenv
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start dev DB
docker compose up -d db redis

# Run migrations
alembic upgrade head

# Start dev server (hot reload)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run tests
pip install pytest pytest-asyncio httpx aiosqlite
pytest tests/ -v

# Lint
ruff check . && ruff format --check . && mypy app/
```

### Frontend (Next.js)

```bash
cd apps/crm-frontend

# Install deps (from repo root)
cd ../..
pnpm install

# Start dev server
pnpm --filter @app/crm-frontend dev

# Run tests
pnpm --filter @app/crm-frontend test

# Lint
pnpm --filter @app/crm-frontend lint
pnpm --filter @app/crm-frontend typecheck
```

### Database Migrations

```bash
cd services/crm

# Create a new migration after model changes
alembic revision --autogenerate -m "describe your change"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show migration history
alembic history
```

---

## Project Structure

```
crm-saas/
├── apps/
│   └── crm-frontend/         # Next.js frontend application
│       ├── src/
│       │   ├── app/          # Next.js App Router pages
│       │   ├── components/   # Reusable UI components
│       │   ├── features/     # Feature-specific components
│       │   ├── lib/          # API client, hooks, stores, utils
│       │   └── types/        # TypeScript type definitions
│       ├── Dockerfile         # Frontend production Dockerfile
│       ├── next.config.ts     # Next.js configuration
│       └── package.json
├── services/
│   └── crm/                  # FastAPI backend service
│       ├── app/
│       │   ├── core/         # Config, DB, security, deps
│       │   ├── models.py     # SQLAlchemy ORM models
│       │   ├── repositories/ # Data access layer
│       │   ├── routes/       # API route handlers
│       │   ├── schemas.py    # Pydantic request/response schemas
│       │   └── main.py       # App entry point
│       ├── alembic/          # Database migrations
│       ├── scripts/          # Entrypoint and utility scripts
│       ├── tests/            # Integration tests (6 modules)
│       ├── Dockerfile         # Backend production Dockerfile
│       └── pyproject.toml
├── packages/
│   ├── eslint-config/        # Shared ESLint configuration
│   ├── shared-types/         # Shared TypeScript types
│   └── shared-utils/         # Shared utility functions
├── .github/
│   ├── workflows/ci.yml      # GitHub Actions CI pipeline
│   ├── ISSUE_TEMPLATE/       # Issue templates
│   ├── pull_request_template.md
│   └── labels.yml            # GitHub labels config
├── docker-compose.yml        # Full-stack Docker Compose
├── .env.example              # Environment variable template
├── Makefile                  # Common commands
├── CHANGELOG.md              # Release history
├── LICENSE                   # MIT License
└── README.md                 # This file
```

---

## Default Credentials

The application requires JWT authentication on all API endpoints. For local
development, the frontend auto-registers a dev user on first load:

| Field              | Value          |
|--------------------|----------------|
| Email              | `dev@crm.local`|
| Password           | `devpass123`   |

The auto-registration happens automatically when you open `http://localhost:3000`
— no manual setup required. The `AuthInitializer` component tries to register the
dev user on first load and falls back to login if the user already exists.

---

## API Overview

All endpoints other than `/auth/register`, `/auth/login`, and `/health` require
a JWT Bearer token in the `Authorization` header. Full interactive documentation
is available at `/docs` when the server is running.

| Resource       | Endpoint                    | Operations              | Auth Required |
|----------------|-----------------------------|-------------------------|--------------|
| Auth           | `/api/v1/auth/register`     | Register + auto-create org | No         |
| Auth           | `/api/v1/auth/login`        | Login, get JWT tokens   | No           |
| Auth           | `/api/v1/auth/refresh`      | Refresh access token    | No*          |
| Auth           | `/api/v1/auth/forgot-password` | Request reset        | No           |
| Auth           | `/api/v1/auth/reset-password`  | Reset password       | No           |
| Auth           | `/api/v1/auth/verify-email` | Verify email address    | No*          |
| Organizations  | `/api/v1/organizations`     | CRUD + list + search    | Yes          |
| Users          | `/api/v1/users`             | CRUD + list + search    | Yes          |
| Contacts       | `/api/v1/contacts`          | CRUD + list + search    | Yes          |
| Companies      | `/api/v1/companies`         | CRUD + list + search    | Yes          |
| Deals          | `/api/v1/deals`             | CRUD + list + search    | Yes          |
| Activities     | `/api/v1/activities`        | CRUD + list + search    | Yes          |
| Notes          | `/api/v1/notes`             | CRUD + list + search    | Yes          |
| Health         | `/health`                   | GET                     | No           |

*\* Token-based endpoints require the token from the previous step, not a user login session.*

### Pagination

All list endpoints support `?offset=0&limit=20` (max 100 per page).

### Search

All list endpoints support `?q=searchterm` for case-insensitive partial matching.

---

## Troubleshooting

### Port conflicts

If ports 3000, 5432, 6379, or 8000 are already in use:

```bash
# Check what's using a port
sudo lsof -i :3000

# Use alternative ports via .env
echo 'FRONTEND_PORT=3001' >> .env
echo 'BACKEND_PORT=8001' >> .env
docker compose up -d
```

### Database connection errors

```bash
# Reset the database completely
make reset

# Or manually
docker compose down -v
docker compose up --build -d
```

### Build cache issues

```bash
# Force a clean rebuild
docker compose build --no-cache
docker compose up -d
```

### Frontend can't reach backend

Ensure the `API_URL` in `.env` matches how the Next.js server can reach the backend:

- **Docker**: defaults to `http://backend:8000` (internal Docker network)
- **Local dev without Docker**: set to `http://localhost:8000`

### Backend migrations fail

```bash
# Check migration status
cd services/crm
alembic current

# Force to a specific revision
alembic upgrade <revision_id>

# Create a fresh migration
alembic revision --autogenerate -m "fix"
alembic upgrade head
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository and create a feature branch
2. **Follow** the [Conventional Commits](https://www.conventionalcommits.org/) format
3. **Write tests** for new features and bug fixes
4. **Run linters** (`make lint`) before committing
5. **Run tests** (`make test`) before pushing
6. **Submit** a pull request using the PR template

### Commit Conventions

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `refactor:` — code restructuring
- `test:` — tests
- `chore:` — tooling, deps, config
- `ci:` — CI/CD changes

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
