# CRM Frontend Dockerfile — Next.js 15 production build
# Multi-stage build with workspace package support

# Stage 1: Install dependencies (all workspace packages)
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace config and lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY .npmrc ./

# Copy workspace packages
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-types/tsconfig.json packages/shared-types/
COPY packages/shared-types/src packages/shared-types/src/
COPY packages/shared-utils/package.json packages/shared-utils/
COPY packages/shared-utils/tsconfig.json packages/shared-utils/
COPY packages/shared-utils/src packages/shared-utils/src/

# Copy frontend package.json
COPY apps/crm-frontend/package.json apps/crm-frontend/

# Install pnpm and all dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Build workspace packages first
RUN corepack enable pnpm && pnpm --filter @app/shared-types build && pnpm --filter @app/shared-utils build

# Copy frontend source
COPY apps/crm-frontend apps/crm-frontend
COPY tsconfig.base.json .

# Build Next.js app (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable pnpm && pnpm --filter @app/crm-frontend build

# Stage 3: Production runner
FROM node:22-alpine AS runner
RUN apk add --no-cache curl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/crm-frontend/.next/standalone ./
COPY --from=builder /app/apps/crm-frontend/.next/static ./apps/crm-frontend/.next/static
COPY --from=builder /app/apps/crm-frontend/public ./apps/crm-frontend/public

# Copy workspace packages into node_modules (they are workspace deps)
COPY --from=builder /app/packages/shared-types/dist ./node_modules/@app/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./node_modules/@app/shared-types/package.json
COPY --from=builder /app/packages/shared-utils/dist ./node_modules/@app/shared-utils/dist
COPY --from=builder /app/packages/shared-utils/package.json ./node_modules/@app/shared-utils/package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

CMD ["node", "server.js"]
