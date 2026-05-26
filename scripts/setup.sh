#!/bin/bash
# =============================================================================
# CRM SaaS — Quick setup script
# =============================================================================
# Usage: ./scripts/setup.sh
#
# This script automates the initial setup:
#   1. Copy .env.example to .env (if .env doesn't exist)
#   2. Build and start all services via Docker Compose
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "=== CRM SaaS Setup ==="
echo ""

# Copy .env.example → .env if .env doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "  → .env created. Edit it to customize settings."
else
    echo ".env already exists — skipping."
fi

echo ""

# Build and start services
echo "Starting services with Docker Compose..."
docker compose up --build -d

echo ""
echo "=== Setup complete ==="
echo ""
echo "Services:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "Useful commands:"
echo "  make logs     — follow logs"
echo "  make down     — stop services"
echo "  make seed     — seed sample data"
echo "  make help     — show all commands"
