07-05-2026
[x] Update logger to pino
[x] Fix prettier
[x] Fix eslint

08-05-2026
[x] Fix knip config
[x] Refine our tsconfig
    - [x] Add Bun types and refine module settings
    - [x] Enable stricter type-checking options
### 🧹 Codebase Cleanup (Knip Findings)
- [x] Remove unused config files (`src/config/constants.ts`, `db-name.ts`, `permission-config.ts`)
- [x] Remove unused utility files (`src/lib/utils/collection.util.ts`, `src/types/global.ts`)
- [x] Remove unused Elysia plugin (`src/lib/elysia/openapi-plugin.ts`)
- [x] Remove unused dependencies from `package.json` (Mongoose, BigNumber, etc.)
- [x] Remove leftover Logtape usage in `src/server.ts` and `src/app.ts`
- [x] Cleanup unused exports identified by Knip
- [x] Refine `knip.jsonc` to ignore necessary runtime strings (Pino transports)

### 🚀 Performance & Observability
- [x] Optimize Drizzle schema indexes
    - [x] Add missing FK indexes for joins (Recipe Items, Conversions)
    - [x] Review query plans for critical paths
- [x] Refine OTEL tracing depth for critical paths
- [x] Implement circular dependency detection

## 📅 Next Phase: Hardening & DX Improvements
### 🛡️ Clean State
- [x] Resolve remaining Knip warnings (16 unused exports, 10 types)
- [x] Ensure `bun run verify` passes with code 0

### 🧪 Quality Assurance
- [x] Set up Bun native integration tests
- [x] Test critical WAC (Weighted Average Cost) calculation paths
- [x] Test Auth/RBAC plugin logic

### ⚖️ Business Logic
- [x] Refine Material Ledger daily snapshot generation
- [x] Implement consolidated (cross-location) stock views