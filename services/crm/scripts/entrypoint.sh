#!/bin/bash
set -euo pipefail

echo "=== CRM Backend Entrypoint ==="
echo "Running database migrations..."

cd /app
alembic upgrade head

# Seed demo organization if none exists
echo "Seeding demo organization..."
PYTHONPATH=/app python scripts/seed.py

echo "Migrations complete. Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
