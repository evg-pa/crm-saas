# CRM Backend

FastAPI + PostgreSQL CRM backend with tenant-scoped multi-tenancy, soft deletes, and async SQLAlchemy 2.0.

## Architecture

```
services/crm/
├── alembic/              # Database migrations (Alembic)
│   └── versions/         # Migration scripts
├── app/
│   ├── core/             # Config, database, security, dependencies
│   │   ├── config.py     # Pydantic-settings configuration
│   │   ├── database.py   # Async engine + session factory
│   │   ├── security.py   # JWT + password hashing
│   │   └── dependencies.py # Pagination + DB session dep
│   ├── models.py         # SQLAlchemy ORM models (6 entities)
│   ├── repositories/     # Data access layer
│   │   ├── base.py       # Generic CRUD with tenant isolation
│   │   └── repos.py      # Entity-specific repositories
│   ├── routes/           # FastAPI route modules (1 per entity)
│   ├── schemas.py        # Pydantic request/response schemas
│   └── main.py           # App entry point, router registration
├── scripts/
│   └── entrypoint.sh     # Docker entrypoint (migrations → server)
├── tests/                # Integration tests (SQLite in-memory)
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml        # Pytest configuration
├── requirements.txt
└── alembic.ini
```

### Entities

| Entity         | Endpoint                    | Description                          |
|----------------|-----------------------------|--------------------------------------|
| Organizations  | `/api/v1/organizations`     | Multi-tenant boundary (top-level)    |
| Contacts       | `/api/v1/contacts`          | Individual people                    |
| Companies      | `/api/v1/companies`         | Business/organization records        |
| Deals          | `/api/v1/deals`             | Sales opportunities                  |
| Activities     | `/api/v1/activities`        | Logged interactions (calls, emails)  |
| Notes          | `/api/v1/notes`             | Free-form notes on contacts          |

All business entities (contacts, companies, deals, activities, notes) are tenant-scoped via `organization_id`. Soft deletes use a `deleted_at` timestamp. IDs are UUIDv4.

### Key Design Decisions

- **Async SQLAlchemy 2.0** with asyncpg for non-blocking DB access
- **Generic repository pattern** for consistent CRUD with automatic tenant filtering
- **Soft deletes** via `deleted_at` — no data is ever hard-deleted
- **SQLite for tests** — integration tests run against in-memory SQLite (no external DB needed)
- **Alembic for migrations** — `alembic upgrade head` runs automatically on container start

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Python 3.12+ (for local development without Docker)

## Quick Start

```bash
cd services/crm
docker compose up --build
```

Once both containers are healthy, the API is available at:

- **Health check**: <http://localhost:8000/health>
- **Interactive API docs (Swagger)**: <http://localhost:8000/docs>
- **ReDoc**: <http://localhost:8000/redoc>

The entrypoint script runs `alembic upgrade head` automatically on startup, so the database schema is always current.

### Verify

```bash
# Health check
curl http://localhost:8000/health
# → {"status": "ok", "version": "0.1.0"}

# Create an organization
curl -X POST http://localhost:8000/api/v1/organizations \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "slug": "acme-corp"}'

# List organizations
curl http://localhost:8000/api/v1/organizations
```

## Environment Variables

| Variable                | Default                                                          | Description                         |
|-------------------------|------------------------------------------------------------------|-------------------------------------|
| `DATABASE_URL`          | `postgresql+asyncpg://crm_user:crm_pass@db:5432/crm_db`         | Async database connection string    |
| `DATABASE_URL_SYNC`     | `postgresql+psycopg2://crm_user:crm_pass@db:5432/crm_db`        | Sync database connection string     |
| `JWT_SECRET_KEY`        | `development-secret-change-in-production`                        | Secret key for JWT token signing    |
| `JWT_ALGORITHM`         | `HS256`                                                          | JWT signing algorithm               |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `30`                                                    | Access token lifetime in minutes    |
| `DEBUG`                 | `false`                                                          | Enable SQL echo and debug mode      |
| `CORS_ORIGINS`          | `["*"]`                                                          | Allowed CORS origins (JSON array)   |
| `APP_NAME`              | `CRM Backend`                                                    | Application display name            |
| `APP_VERSION`           | `0.1.0`                                                          | Application version string          |

All variables are loaded via `pydantic-settings` with `.env` file support for local development. In Docker, variables are set in `docker-compose.yml`.

## Local Development

### Setup (without Docker)

```bash
cd services/crm

# Create virtual environment
python3.12 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL (e.g. via Docker)
docker run -d --name crm-db-dev \
  -e POSTGRES_USER=crm_user \
  -e POSTGRES_PASSWORD=crm_pass \
  -e POSTGRES_DB=crm_db \
  -p 5432:5432 \
  postgres:16-alpine

# Create a local .env
cat > .env << 'EOF'
DATABASE_URL=postgresql+asyncpg://crm_user:crm_pass@localhost:5432/crm_db
DATABASE_URL_SYNC=postgresql+psycopg2://crm_user:crm_pass@localhost:5432/crm_db
DEBUG=true
EOF

# Run migrations
alembic upgrade head

# Start dev server (with hot reload)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Running Tests

```bash
cd services/crm
pip install pytest pytest-asyncio httpx aiosqlite
pytest tests/ -v
```

Tests use in-memory SQLite (via `aiosqlite`) and require no external database. Each test runs in an isolated transaction via savepoint rollback.

### Creating Migrations

After changing models in `app/models.py`:

```bash
cd services/crm
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

Review the generated migration in `alembic/versions/` before committing.

## API Overview

All endpoints are prefixed with `/api/v1/` and include:

- **CRUD operations**: POST (create), GET (list/get), PATCH (update), DELETE (soft-delete)
- **Pagination**: `?offset=0&limit=20` (max 100 per page)
- **Search**: `?q=searchterm` on list endpoints (case-insensitive partial match)
- **Tenant filtering**: all business entity endpoints require `?organization_id=<uuid>`

Full interactive documentation is available at <http://localhost:8000/docs> when the server is running.
