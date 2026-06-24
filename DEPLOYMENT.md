# DEPLOYMENT.md — CRM SaaS Deployment Guide

Staging and production deployment procedures for the CRM SaaS application.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    GitHub Actions                     │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │ CI (PR)  │──▶│ Build & Push │──▶│ Deploy SSH   │  │
│  │ lint/test│   │ to GHCR      │   │ to staging   │  │
│  └──────────┘   └──────────────┘   └─────────────┘  │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│                 Staging Server (VPS)                   │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐  │
│  │  nginx │▶│frontend│▶│ backend  │─│ PostgreSQL  │  │
│  │  :443  │ │ :3000  │ │ :8000    │ │ :5432       │  │
│  └────────┘ └────────┘ └────┬─────┘ └────────────┘  │
│                             │                         │
│                        ┌────▼─────┐                   │
│                        │  Redis    │                   │
│                        │  :6379    │                   │
│                        └──────────┘                   │
└──────────────────────────────────────────────────────┘
```

---

## Docker Images

Built and pushed to **GitHub Container Registry (ghcr.io)**:

| Image    | Registry Path                      |
| -------- | ---------------------------------- |
| Backend  | `ghcr.io/evg-pa/crm-saas-backend`  |
| Frontend | `ghcr.io/evg-pa/crm-saas-frontend` |

Tags: `latest`, git SHA, branch name.

---

## Environment Configuration

### File Hierarchy

| File                         | Purpose                                                    | Committed?         |
| ---------------------------- | ---------------------------------------------------------- | ------------------ |
| `.env.example`               | Template with dev defaults; copy to `.env` for local dev   | ✅ Yes             |
| `.env.staging`               | Real staging credentials (generated secrets)               | ❌ No (gitignored) |
| `.env`                       | Active env file (symlink/copy of `.env.staging` on server) | ❌ No (gitignored) |
| `docker-compose.yml`         | Base service definitions with `${VAR:-default}` fallbacks  | ✅ Yes             |
| `docker-compose.staging.yml` | Staging overrides (port restrictions, restart policy)      | ✅ Yes             |

### Required Secrets (GitHub Actions `staging` environment)

These must be configured in **GitHub → Settings → Environments → staging → Secrets**:

| Secret                      | Description                       | Generation Command                  |
| --------------------------- | --------------------------------- | ----------------------------------- |
| `STAGING_HOST`              | Staging server IP or hostname     | —                                   |
| `STAGING_USER`              | SSH user for deployment           | —                                   |
| `STAGING_SSH_KEY`           | SSH private key for deployment    | `ssh-keygen -t ed25519 -C "deploy"` |
| `STAGING_POSTGRES_USER`     | PostgreSQL user                   | choose a non-obvious name           |
| `STAGING_POSTGRES_PASSWORD` | PostgreSQL password               | `openssl rand -hex 16`              |
| `STAGING_POSTGRES_DB`       | PostgreSQL database name          | choose a non-obvious name           |
| `STAGING_JWT_SECRET_KEY`    | JWT signing secret                | `openssl rand -hex 32`              |
| `STAGING_CORS_ORIGINS`      | Allowed CORS origins (JSON array) | `["https://staging.example.com"]`   |

### CORS Origins

For staging, configure the actual domain(s) that will access the API:

```
# Single domain
CORS_ORIGINS=["https://staging.example.com"]

# Multiple origins (local dev + staging)
CORS_ORIGINS=["http://localhost:3000","https://staging.example.com"]
```

The backend's `cors_origins` setting is parsed from the env var as a JSON array by pydantic-settings.

---

## CI/CD Pipeline

### CI (`ci.yml`) — runs on every PR and push to `main`

| Job             | What it checks                                  |
| --------------- | ----------------------------------------------- |
| `lint-backend`  | Ruff format, Ruff lint, mypy type check         |
| `test-backend`  | Pytest integration tests (SQLite in-memory)     |
| `lint-frontend` | Prettier format, ESLint, TypeScript type check  |
| `test-frontend` | Vitest unit/component tests                     |
| `docker-build`  | Validates both Docker images build successfully |

All lint and test jobs must pass before docker-build runs.

### Deploy (`deploy.yml`) — runs on push to `main` and manual trigger

1. **Build & Push**: Builds Docker images, tags with SHA + `latest`, pushes to GHCR
2. **Deploy to Staging**:
   - Writes `.env.staging` from GitHub Actions secrets
   - Copies `.env.staging` to the staging server via SCP
   - Runs `docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d`
   - Verifies backend and frontend health checks

---

## Manual Deployment

### Prerequisites

- Docker and Docker Compose installed on the target server
- SSH access configured
- `.env.staging` file created on the server with real credentials

### Deploy Steps

```bash
# 1. SSH into staging server
ssh deploy@staging.example.com

# 2. Navigate to app directory
cd /opt/crm-saas

# 3. Pull latest images
docker compose -f docker-compose.yml -f docker-compose.staging.yml pull

# 4. Deploy (with zero-downtime for stateless services)
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --remove-orphans

# 5. Verify
docker compose ps
curl -fsS http://localhost:8000/health
curl -fsS -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000
```

### Rollback

```bash
# Pull a specific image tag (the previous known-good SHA)
docker pull ghcr.io/evg-pa/crm-saas-backend:<previous-sha>
docker pull ghcr.io/evg-pa/crm-saas-frontend:<previous-sha>

# Retag as latest and restart
docker tag ghcr.io/evg-pa/crm-saas-backend:<previous-sha> ghcr.io/evg-pa/crm-saas-backend:latest
docker tag ghcr.io/evg-pa/crm-saas-frontend:<previous-sha> ghcr.io/evg-pa/crm-saas-frontend:latest
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

---

## Local Verification

Before deploying to staging, verify the full stack locally:

```bash
# 1. Set up staging env locally
cp .env.staging .env

# 2. Start all services
docker compose up --build -d

# 3. Wait for health checks (30-60s)
docker compose ps

# 4. Verify backend health
curl -fsS http://localhost:8000/health

# 5. Verify frontend is reachable
curl -fsS -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000

# 6. Check logs for errors
docker compose logs backend | grep -i error
docker compose logs frontend | grep -i error
```

---

## Credential Rotation

When rotating secrets:

1. Generate new values:

   ```bash
   openssl rand -hex 32  # JWT secret
   openssl rand -hex 16  # DB password
   ```

2. Update GitHub Actions secrets in the `staging` environment

3. Trigger a manual deploy via workflow_dispatch to apply

4. Verify health checks pass

### JWT Secret Rotation Impact

Rotating `JWT_SECRET_KEY` invalidates all existing access tokens. Users will need to re-authenticate. Schedule rotations during low-traffic windows.

---

## Monitoring & Health Checks

### Container Health Checks

All services have built-in Docker health checks:

| Service    | Check            | Interval |
| ---------- | ---------------- | -------- |
| PostgreSQL | `pg_isready`     | 5s       |
| Redis      | `redis-cli ping` | 5s       |
| Backend    | `GET /health`    | 15s      |
| Frontend   | `GET /`          | 15s      |

### Application Health Endpoint

`GET /health` returns:

```json
{
  "status": "healthy",
  "app_name": "CRM Backend",
  "app_version": "0.1.0"
}
```

---

## Common Operations

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend

# Last 100 lines
docker compose logs --tail=100 backend
```

### Database Migrations

```bash
# SSH to server
cd /opt/crm-saas

# Run migrations
docker compose exec backend alembic upgrade head

# Check migration status
docker compose exec backend alembic current
```

### Seed Data

```bash
docker compose exec backend python scripts/seed.py
```

### Restart a Single Service

```bash
docker compose restart backend
docker compose restart frontend
```

---

## Troubleshooting

### Container fails to start

```bash
# Check exit status
docker compose ps

# View startup logs
docker compose logs backend 2>&1 | tail -50

# Common issues:
# - Missing .env file → ensure .env.staging exists and is copied to .env
# - DB connection refused → check PostgreSQL health
# - Port conflict → check for other processes on 8000/3000
```

### Health check failing

```bash
# Test health endpoint directly
curl -v http://localhost:8000/health

# Check if the service is listening
docker compose exec backend python -c "
import urllib.request
urllib.request.urlopen('http://localhost:8000/health')
"
```

### Image pull failures

```bash
# Verify GHCR access
docker login ghcr.io -u <github-user> --password-stdin

# Pull manually to check
docker pull ghcr.io/evg-pa/crm-saas-backend:latest
```
