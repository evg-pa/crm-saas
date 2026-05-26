# =============================================================================
# CRM SaaS — Makefile
# =============================================================================
# Common commands for development and operations.
#
# Quick start:
#   make up          # Start all services
#   make seed        # Seed the database with sample data
#   make test        # Run backend + frontend tests
# =============================================================================

.PHONY: up down logs restart reset backend frontend test seed clean help

# Default target
.DEFAULT_GOAL := help

# ---------------------------------------------------------------------------
# Docker Compose
# ---------------------------------------------------------------------------

## up: Start all services (build + run in background)
up:
	docker compose up --build -d

## up-dev: Start in foreground with logs
up-dev:
	docker compose up --build

## down: Stop all services and remove containers
down:
	docker compose down

## logs: Follow logs for all services
logs:
	docker compose logs -f

## logs-backend: Follow backend logs only
logs-backend:
	docker compose logs -f backend

## logs-frontend: Follow frontend logs only
logs-frontend:
	docker compose logs -f frontend

## restart: Restart all services
restart: down up

## restart-backend: Restart backend only
restart-backend:
	docker compose restart backend

## restart-frontend: Restart frontend only
restart-frontend:
	docker compose restart frontend

## reset: Full reset — stop, remove volumes, rebuild, start
reset:
	docker compose down -v
	docker compose up --build -d

## clean: Remove containers, volumes, and built images
clean:
	docker compose down -v --rmi all

# ---------------------------------------------------------------------------
# Individual Services
# ---------------------------------------------------------------------------

## backend: Start only the backend + database
backend:
	docker compose up --build -d db redis backend

## frontend: Start frontend (depends on backend)
frontend:
	docker compose up --build -d db redis backend frontend

# ---------------------------------------------------------------------------
# Development / Testing
# ---------------------------------------------------------------------------

## shell-backend: Open a shell in the backend container
shell-backend:
	docker compose exec backend /bin/bash

## shell-frontend: Open a shell in the frontend container
shell-frontend:
	docker compose exec frontend /bin/sh

## db-shell: Open a psql shell in the database container
db-shell:
	docker compose exec db psql -U crm_user -d crm_db

## redis-shell: Open a redis-cli shell
redis-shell:
	docker compose exec redis redis-cli

## test: Run backend and frontend tests
test:
	@echo "Running backend tests..."
	cd services/crm && pip install pytest pytest-asyncio httpx aiosqlite > /dev/null 2>&1 && python -m pytest tests/ -v
	@echo ""
	@echo "Running frontend tests..."
	cd apps/crm-frontend && pnpm test

## test-backend: Run backend tests only
test-backend:
	cd services/crm && pip install pytest pytest-asyncio httpx aiosqlite > /dev/null 2>&1 && python -m pytest tests/ -v

## test-frontend: Run frontend tests only
test-frontend:
	cd apps/crm-frontend && pnpm test

## lint: Run linters (backend + frontend)
lint:
	@echo "Running backend linters..."
	cd services/crm && pip install ruff black mypy > /dev/null 2>&1 && ruff check . && black --check . && mypy app/
	@echo ""
	@echo "Running frontend linters..."
	cd apps/crm-frontend && pnpm lint && pnpm typecheck

## seed: Seed the database with sample data
seed:
	docker compose exec backend python scripts/seed.py

# ---------------------------------------------------------------------------
# Migrations
# ---------------------------------------------------------------------------

## migrate: Run database migrations
migrate:
	docker compose exec backend alembic upgrade head

## migrate-create: Create a new migration (usage: make migrate-create MSG="add users table")
migrate-create:
	docker compose exec backend alembic revision --autogenerate -m "$(MSG)"

## migrate-down: Roll back last migration
migrate-down:
	docker compose exec backend alembic downgrade -1

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

## help: Show this help message
help:
	@echo "CRM SaaS — available commands:"
	@echo ""
	@grep -E '^## [a-zA-Z_-]+:' Makefile | sed 's/## //' | column -t -s ':'
