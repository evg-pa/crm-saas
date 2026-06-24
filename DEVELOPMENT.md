# DEVELOPMENT.md — APP Company Monorepo

Comprehensive developer onboarding for the **Autonomous SaaS App Generation** project. Any new agent (Coder, QA, etc.) should be able to get started from this document without asking questions.

---

## Prerequisites

| Tool        | Minimum Version      | How to Check     |
| ----------- | -------------------- | ---------------- |
| **Node.js** | v20+ (v22 preferred) | `node --version` |
| **pnpm**    | 9.0+ (11.2 pinned)   | `pnpm --version` |
| **git**     | 2.40+                | `git --version`  |

**Optional / future**:

| Tool           | Purpose                      | Notes                     |
| -------------- | ---------------------------- | ------------------------- |
| Docker         | PostgreSQL, Redis (Phase 2+) | Not yet available on host |
| Docker Compose | Dev service orchestration    | Not yet available on host |

### Installing pnpm

If pnpm is not installed globally, you can invoke it via npx:

```bash
npx pnpm@11 install
```

To install globally (recommended):

```bash
npm install -g pnpm@11
```

Or use corepack:

```bash
corepack enable
corepack prepare pnpm@11 --activate
```

---

## First-Time Setup

```bash
# 1. Clone (or cd into) the repo
cd app-monorepo

# 2. Install all dependencies (respects pnpm workspaces)
pnpm install

# 3. Verify tooling
pnpm run typecheck    # TypeScript compilation check
pnpm run lint         # ESLint across all packages
pnpm run format:check # Prettier format check

# 4. Build all packages
pnpm run build

# 5. Run tests
pnpm run test
```

### Environment Variables

Copy `.env.example` to `.env` (when it exists) and fill in required values:

```bash
cp .env.example .env
```

| Variable       | Required | Purpose                                                         |
| -------------- | -------- | --------------------------------------------------------------- |
| `DATABASE_URL` | Yes      | SQLite file path (e.g., `file:./data/dev.db`) or PostgreSQL URL |
| `NODE_ENV`     | No       | `development` (default), `test`, `production`                   |
| `PORT`         | No       | API server port (default: `3001`)                               |
| `LOG_LEVEL`    | No       | `debug`, `info` (default), `warn`, `error`                      |

---

## Project Structure

```
app-monorepo/
├── README.md                  # High-level project overview
├── DEVELOPMENT.md             # This file — developer onboarding
├── package.json               # Root workspace config + scripts
├── pnpm-workspace.yaml        # pnpm workspace definition
├── tsconfig.base.json         # Shared TypeScript compiler options
├── .gitignore                 # Ignored files (deps, build output, secrets)
├── .commitlintrc.json         # Commit message conventions (Conventional Commits)
├── .prettierrc.js             # Prettier formatting rules
├── .eslintrc.js               # Root ESLint config
├── packages/                  # Shared internal packages
│   ├── shared-types/          # @app/shared-types — canonical TypeScript types
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared-utils/          # @app/shared-utils — utility functions
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── eslint-config/         # @app/eslint-config — shared ESLint rules
│       ├── index.js
│       ├── package.json
│       └── tsconfig.json
├── apps/                      # Application packages
│   ├── api/                   # Express API server (Phase 1)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   └── middleware/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                   # Next.js frontend (Phase 1)
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   └── lib/
│       ├── package.json
│       └── tsconfig.json
├── data/                      # SQLite databases (gitignored)
│   └── .gitkeep
└── scripts/                   # Build and utility scripts
    └── setup.sh
```

### Key Directories

| Directory   | Purpose                                                       |
| ----------- | ------------------------------------------------------------- |
| `packages/` | Internal shared libraries consumed by apps and other packages |
| `apps/`     | Deployable applications (API server, web frontend)            |
| `data/`     | Local development data (SQLite DBs) — gitignored              |
| `scripts/`  | Developer utility scripts                                     |

### Package Naming Convention

All internal packages use the `@app/` scope:

- `@app/shared-types` — shared TypeScript types and interfaces
- `@app/shared-utils` — shared utility functions
- `@app/eslint-config` — shared ESLint configuration
- `@app/api` — API server
- `@app/web` — web frontend

---

## Common Commands

All commands are run from the monorepo root unless specified otherwise.

### Development

```bash
# Start all packages in dev mode (parallel)
pnpm dev

# Start a specific package in dev mode
pnpm --filter @app/api dev
pnpm --filter @app/web dev
```

### Building

```bash
# Build all packages
pnpm build

# Build a specific package
pnpm --filter @app/shared-types build
```

### Type Checking

```bash
# TypeScript type-check all packages
pnpm typecheck

# Type-check a specific package
pnpm --filter @app/api typecheck
```

### Linting

```bash
# Lint all packages
pnpm lint

# Lint and auto-fix
pnpm --filter @app/api lint --fix
```

### Formatting

```bash
# Format all files
pnpm format

# Check formatting (CI-friendly)
pnpm format:check
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @app/api test

# Run tests in watch mode
pnpm --filter @app/api test -- --watch

# Run tests with coverage
pnpm --filter @app/api test -- --coverage
```

### Cleaning

```bash
# Remove all build artifacts and node_modules
pnpm clean

# Then reinstall fresh
pnpm install && pnpm build
```

### Adding Dependencies

```bash
# Add a dependency to a specific package
pnpm --filter @app/api add express

# Add a dev dependency
pnpm --filter @app/api add -D @types/express

# Add a workspace package as a dependency
pnpm --filter @app/api add @app/shared-types@workspace:*

# Add a root dev dependency
pnpm add -Dw prettier
```

---

## Commit Conventions

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) via `commitlint` (see `.commitlintrc.json`).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Allowed Types

| Type       | Usage                                                   |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `style`    | Formatting, missing semicolons (no code change)         |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or updating tests                                |
| `chore`    | Build process, tooling, dependencies                    |
| `ci`       | CI/CD configuration                                     |
| `perf`     | Performance improvement                                 |
| `revert`   | Revert a previous commit                                |

### Scope

Use the package name where the change lives:

```
feat(shared-types): add Project and User interfaces
fix(api): handle empty body in POST /projects
chore(eslint-config): add no-unused-vars rule
docs: update DEVELOPMENT.md prerequisites
```

If a change spans multiple packages, use a broader scope or omit it:

```
feat: add monorepo-wide linting infrastructure
```

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or append `!` after the type:

```
feat!(api): change POST /projects response shape
```

### Examples

```
feat(shared-types): add AppSpec and DeploymentStatus enums

Introduces the core type definitions for app specifications
and deployment lifecycle tracking. Both packages (@app/api
and @app/web) will consume these types.
```

```
fix(api): sanitize project name input to prevent injection

Previously, user-supplied project names were inserted into
queries without sanitization. Now all project names pass
through a slugify-validate pipeline.

Closes #42
```

---

## Branch Naming Conventions

```
<type>/<short-description>
```

### Types

| Prefix      | Purpose          | Example                   |
| ----------- | ---------------- | ------------------------- |
| `feat/`     | New feature      | `feat/app-spec-parser`    |
| `fix/`      | Bug fix          | `fix/project-duplication` |
| `docs/`     | Documentation    | `docs/api-endpoints`      |
| `refactor/` | Code refactoring | `refactor/type-system`    |
| `chore/`    | Tooling, config  | `chore/update-deps`       |
| `test/`     | Test additions   | `test/deployment-flow`    |

### Guidelines

- Use **kebab-case** for branch names
- Keep names **short and descriptive** (3-5 words max)
- Reference the issue number when applicable: `feat/project-crud-APP-15`
- Delete branches after merge

### Examples

```
feat/project-crud-endpoints
fix/project-name-validation
docs/dev-setup-guide
refactor/error-handling-middleware
chore/upgrade-pnpm-v11
test/user-auth-flow
```

---

## How to Add a New Package

### 1. Create the package directory

```bash
mkdir -p packages/my-new-package/src
cd packages/my-new-package
```

### 2. Create `package.json`

```json
{
  "name": "@app/my-new-package",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "vitest run"
  },
  "devDependencies": {
    "@app/eslint-config": "workspace:*",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  }
}
```

### 3. Create `tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/.tsbuildinfo"
  },
  "include": ["src/**/*"],
  "references": []
}
```

If the package depends on other workspace packages, add them to `references`:

```json
"references": [
  { "path": "../shared-types" },
  { "path": "../shared-utils" }
]
```

### 4. Add entry point

```typescript
// packages/my-new-package/src/index.ts
export function hello(): string {
  return 'Hello from @app/my-new-package';
}
```

### 5. Register in `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

If the existing globs already cover your new package, no change needed.

### 6. Install and verify

```bash
# From repo root
pnpm install
pnpm --filter @app/my-new-package build
pnpm --filter @app/my-new-package typecheck
pnpm --filter @app/my-new-package test
```

### 7. Use it in another package

```bash
pnpm --filter @app/api add @app/my-new-package@workspace:*
```

```typescript
// In @app/api
import { hello } from '@app/my-new-package';
```

---

## Troubleshooting

### `pnpm install` fails with lockfile errors

```bash
# Delete lockfile and node_modules, then reinstall
rm -rf node_modules pnpm-lock.yaml
rm -rf packages/*/node_modules apps/*/node_modules
pnpm install
```

### TypeScript errors about missing module declarations

Ensure the dependency package has been built first:

```bash
pnpm --filter @app/shared-types build
pnpm --filter @app/my-package build
```

### `tsc --build` fails with stale references

Clean and rebuild:

```bash
pnpm clean
pnpm install
pnpm build
```

### pnpm workspace protocol errors

Make sure workspace dependencies use the `workspace:` protocol:

```bash
# Correct
pnpm --filter @app/api add @app/shared-types@workspace:*

# Incorrect
pnpm --filter @app/api add @app/shared-types
```

### Port already in use

Check what's running on the port and kill it:

```bash
lsof -i :3001
kill -9 <PID>
```

### Commit rejected by commitlint

Re-check your commit message format:

```bash
# Should match: type(scope): description
git log -1 --format="%s"  # shows last commit message

# Rewrite the last commit message
git commit --amend -m "feat(api): add project CRUD endpoints"
```

If using an interactive editor, run commitlint manually to test:

```bash
echo "feat(api): add project CRUD endpoints" | npx commitlint
```

### `pnpm` command not found

Use npx as a fallback:

```bash
npx pnpm@11 install
npx pnpm@11 dev
```

Or add to PATH after global install:

```bash
npm install -g pnpm@11
# Add npm's global bin to PATH if needed
export PATH="$(npm config get prefix)/bin:$PATH"
```

### Database locked (SQLite)

SQLite only allows one writer at a time. If you see `SQLITE_BUSY`:

```bash
# Stop all dev processes
pkill -f "pnpm.*dev"

# Restart only what you need
pnpm --filter @app/api dev
```

---

## Editor Setup (Recommended)

### VS Code

Install these extensions:

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **Prisma** (`prisma.prisma`)

Recommended workspace settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/dist": true,
    "**/node_modules": true
  }
}
```

---

## Pre-Commit Checklist

Before opening a PR:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm test` passes
- [ ] New code has tests
- [ ] Commit messages follow Conventional Commits
- [ ] Branch name follows conventions
- [ ] No secrets or `.env` files committed

---

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [ESLint Shareable Configs](https://eslint.org/docs/latest/extend/shareable-configs)
