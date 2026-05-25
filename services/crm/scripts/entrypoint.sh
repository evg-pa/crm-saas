#!/bin/bash
set -euo pipefail

echo "=== CRM Backend Entrypoint ==="
echo "Running database migrations..."

cd /app
alembic upgrade head

echo "Migrations complete. Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
