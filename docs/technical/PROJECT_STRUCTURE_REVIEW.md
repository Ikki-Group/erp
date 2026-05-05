# Project Structure Review

## Overview

Comprehensive review of Ikki ERP project structure as of May 2026.

## Current Structure

### Root Level

```
ikki-erp/
├── apps/              # Monorepo applications
│   ├── server/        # Backend API (Bun + Elysia)
│   ├── web/           # Frontend (React + Vite)
│   └── e2e/           # End-to-end tests
├── docs/              # Documentation
├── packages/          # Shared packages (empty)
├── .agents/           # Agent skills (empty)
├── .windsurf/         # Windsurf plans (empty)
└── CLAUDE.md          # AI context
```

## Issues Found

### 1. Empty Directories

- `apps/server/src/shared` - Empty, should be removed
- `apps/server/src/tests/flows` - Empty, should be removed
- `apps/server/src/tests/http/tool` - Empty, should be removed
- `apps/server/src/modules/inventory/stock-summary/sub-services` - Empty, should be removed
- `apps/web/src/features/company/components` - Empty, should be removed
- `docs/draft` - Empty, should be removed

### 2. Backup Files

- `apps/server/Dockerfile.bak` - Backup file, should be removed

### 3. Empty Documentation

- `apps/server/README.md` - Empty file, should be populated or removed

### 4. Node Modules Build Artifacts

- `apps/web/node_modules/.vite-temp` - Build artifacts
- `apps/web/.tanstack/tmp` - Build artifacts
- `apps/web/.wrangler/tmp` - Build artifacts
- These should be in .gitignore

### 5. Monorepo Structure

- `packages/` directory exists but is empty
- Consider removing if not planning to use shared packages

## Strengths

### 1. Clear Separation

- **apps/server** - Backend service
- **apps/web** - Frontend application
- **apps/e2e** - End-to-end tests

### 2. Modular Architecture

- Server: Feature-based modules in `src/modules/`
- Web: Feature-based structure in `src/features/`
- Core infrastructure properly separated from utilities

### 3. Documentation

- Well-organized docs structure:
  - `docs/backlog/` - Feature backlog
  - `docs/features/` - Feature documentation
  - `docs/technical/` - Technical docs
  - `docs/product/` - Product docs
  - `docs/templates/` - Document templates

### 4. Configuration Management

- Server: `src/config/` for environment configuration
- Web: `src/config/` for app configuration

## Recommendations

### High Priority

1. **Remove empty directories** - Clean up unused directories
2. **Remove backup files** - Delete Dockerfile.bak
3. **Update .gitignore** - Ensure build artifacts are ignored
4. **Populate or remove empty README** - Add server documentation

### Medium Priority

1. **Consider removing packages/** - If not using shared packages
2. **Add server README** - Document server setup and usage
3. **Standardize directory naming** - Ensure consistency (e.g., sub-services vs subServices)

### Low Priority

1. **Add architecture diagrams** - Visual documentation of system architecture
2. **Add contribution guidelines** - CONTRIBUTING.md
3. **Add changelog** - Track changes across versions

## Current State Summary

### Server Structure (apps/server)

```
src/
├── core/          ✅ Essential infrastructure (database, http, cache, logger, otel)
├── lib/           ✅ Shared utilities (utils, auth, validation)
├── modules/       ✅ Feature-based modules (22 modules)
├── config/        ✅ Configuration (env.ts, seed-config.ts)
├── db/            ✅ Database schema
├── tests/         ⚠️  Has empty subdirectories
├── types/         ✅ Type definitions
└── shared/        ❌ Empty (should remove)
```

### Web Structure (apps/web)

```
src/
├── features/      ✅ Feature-based structure
├── components/    ✅ Reusable components
├── lib/           ✅ Shared utilities
├── hooks/         ✅ Custom React hooks
├── routes/        ✅ Route definitions
├── styles/        ✅ Single canonical stylesheet (main.css)
├── config/        ✅ App configuration
└── types/         ✅ Type definitions
```

## Next Steps

1. Clean up empty directories
2. Remove backup files
3. Update .gitignore
4. Add server documentation
