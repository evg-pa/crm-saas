# CRM Backend Dockerfile — Python 3.12 with FastAPI
#
# Multi-stage build for a minimal production image:
# 1. builder — install system deps and Python packages
# 2. runner  — lightweight production runtime as non-root

# ── Stage 1: Builder ──────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies to a venv
COPY requirements.txt .
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Production Runner ────────────────────────────────
FROM python:3.12-slim AS runner

# Install runtime system deps only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 app && \
    useradd --system --uid 1001 --gid app app

# Copy virtualenv from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copy application code
COPY . .

# Make scripts executable
RUN chmod -R a+rX /app/

# Use non-root user
USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

ENTRYPOINT ["scripts/entrypoint.sh"]
