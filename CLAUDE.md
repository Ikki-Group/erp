# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🛠 Development Commands

### Root Commands
- **Dev (Server)**: `bun run dev:server` (auto-restarts on file changes)
- **Dev (Web)**: `bun run dev:web` (Vite dev server on port 3000)
- **Lint**: `bun run lint` (using Oxlint, type-aware)
- **Format**: `bun run format` (using Oxfmt)
- **Check All**: `bun run check` (lint + format:check + knip)

### Backend (`apps/server`) Commands
- **Test**: `bun run test` (all tests + coverage) or `bun test src/path/to/test.ts` (single test file)
- **Dev with Debug**: `bun run dev:debug` (adds `--inspect` for debugger attachment)
- **Typecheck**: `bun run typecheck` (TypeScript type checking)
- **Verify**: `bun run verify` (lint + typecheck + knip + check-deps; use before PR)
- **DB Operations**:
  - `bun run db:generate` (generate migrations from schema changes)
  - `bun run db:migrate` (apply pending migrations)
  - `bun run db:studio` (open Drizzle Studio for visual DB inspection)
  - `bun run db:reset` (wipe and reset the database)
  - `bun run db:seed` (seed production-like data)
  - `bun run db:seed-dev` (seed dev sample data)
- **Dependency Audit**: `bun run check-deps` (circular dependency check via dpdm)
- **Build**: `bun run build` (minified bundle to `dist/server.js`)

### Frontend (`apps/web`) Commands
- **Test**: `bun run test` (run Vitest suite)
- **Typecheck**: `bun run typecheck` (TypeScript type checking)
- **Build**: `bun run build` (production Vite build)
- **Preview**: `bun run preview` (preview production build locally)

## 🏛 Code Architecture & Patterns

### Core Principles
- **Runtime**: Exclusively use **Bun** (runtime, package manager, test runner).
- **IDs**: Use **Serial Integers** for PKs/FKs. Avoid UUIDs unless specified.
- **Validation**: Use `@/core/validation` primitives for schemas (e.g., `zId`, `zc`, `zq`).
- **Composition**: Use **Spread-Shape Pattern** for Zod DTOs instead of `.extend()` to maintain clean TS inference.
  ```typescript
  export const MyDto = z.object({ ...BaseDto.shape, ...zId.shape })
  ```
- **Response Wrappers**: Use `res.ok()` for single-object responses, `res.paginated()` for list responses (from `@/core/http/response`).
- **Error Handling**: Throw custom error classes (`NotFoundError`, `ConflictError`, `InternalServerError` from `@/core/http/errors`). Framework handles conversion to HTTP responses.
- **Linting**: Uses **Oxlint** (with `--type-aware` for backend) and **Oxfmt**. Do not add ESLint/Prettier configs.

### Backend Architecture (The Golden Path 2.1)
- **Structure**: Layer 0 (Service) → Layer 1 (Router). Request flows: Router (validation + auth) → Service (logic + DB mutations) → Response wrapper.
- **Module Structure**: Each module has `service/`, `repo/`, `router/`, and `dto/` subdirectories:
  - **`dto/`**: Zod schemas for requests/responses. Use `*Dto` suffix (e.g., `LocationCreateDto`, `LocationUpdateDto`).
  - **`service/`**: Business logic, DB operations, caching, auditing, and telemetry. Services own repositories.
  - **`repo/`**: Database queries using Drizzle. Services instantiate repos in constructor (dependency injection pattern).
  - **`router/`**: Elysia route handlers. Use **inline async functions** with explicit names for accurate type inference:
    ```typescript
    async function list({ query }) { return service.handleList(query) }
    ```
- **Service Methods**: Use `handleX` prefix for public methods (e.g., `handleCreate`, `handleList`, `handleDetail`). Internal private methods don't use prefix.
- **DTOs**: Located in `dto/`. MUST append `Dto` suffix (e.g., `LocationDto`, `CreateLocationDto`).
- **Error Handling**: Services throw custom errors; Elysia error handler converts to HTTP. Standard errors: `NotFoundError`, `ConflictError`, `UnauthorizedError`, `InternalServerError`.
- **Caching**: Use `bento` namespace cache for expensive queries (e.g., `const cache = bento.namespace('location-master')`).
- **Auditing**: Spread audit metadata (userId, timestamp) in service methods via DTO extensions.
- **Telemetry**: Use `@elysiajs/opentelemetry` `record()` wrapper for tracing key operations.
- **Dependency Injection**: Constructor-based injection managed in `src/modules/_registry.ts`. Services explicitly declare dependencies.
- **Authentication**: Use `auth: true` guard in route options. Access user via `({ auth }) => auth.user` and `auth.userId`.

### Module Layering & Dependencies
- **Layer 0 (Core)**: `location`, `product`. No dependencies.
- **Layer 1 (Master Data)**: `iam`, `material`, `supplier`, `employee`, `finance`. May depend on Layer 0.
- **Layer 1.5 (Security)**: `auth`. Depends on `iam`.
- **Layer 2 (Operations)**: `inventory`, `recipe`, `sales`, `purchasing`. May depend on Layer 0, 1, 1.5.
- **Layer 3 (Aggregators)**: `production`, `hr`, `dashboard`, `moka`, `tool`. May depend on all lower layers.
- **Import Rules**: Modules can only depend on lower layers. Circular dependencies are forbidden. Use `bun run check-deps` to verify.

### Database & Migrations
- **Schema**: Defined in `src/db/schema.ts` using Drizzle. Use serial integers for IDs with `primaryKey()`.
- **Migrations**: Generated via `bun run db:generate` from schema changes. Always review auto-generated migrations.
- **Migration Flow**: Schema change → `db:generate` → `db:migrate` (applies in dev) → commit migration file.
- **Audit Columns**: Use standard audit columns (e.g., `createdAt`, `updatedAt`, `createdBy`) via column helpers.
- **Relations**: Define via `.references()` on foreign keys, use `RelationMap` utility for nested queries.

### Frontend Architecture
- **Framework**: React 19 + Vite + Tailwind CSS v4.
- **Routing**: `@tanstack/react-router` with file-based routing in `src/routes/`. Routes auto-generated from file structure.
- **State Management**:
  - **Server State**: `@tanstack/react-query` v5 (TanStack Query). Use `useQuery` for fetches, `useMutation` for mutations.
  - **Local State**: `zustand` v5. Create stores in `src/lib/store/` with clear action naming.
- **Forms**: `@tanstack/react-form` + Zod validation. Forms automatically sync with Zod schemas from backend DTOs.
- **API Client**: `ky` client factory in `src/lib/api/`. Pre-configured with base URL, headers, and error handling.
- **Data Fetching Pattern**: Fetch DTOs from backend, validate with Zod, render with React components. Use query keys for cache invalidation.
- **Component Structure**: Colocate related files (hooks, queries, components). Use compound components for complex UI.
- **Type Safety**: Import backend DTOs directly when possible; avoid duplicating types.

## 📋 Templates & Reference
- **Templates**: Reference `docs/templates/` for standard DTO, Service, and Router implementations.
- **Reference Modules**: Use `src/modules/location/` (Layer 0, simple CRUD) and `src/modules/iam/` (Layer 1, complex business logic) as the standard for implementation patterns.
- **New Module Checklist**:
  1. Create module folder in `src/modules/{name}/`
  2. Add `dto/index.ts` with Zod schemas using Spread-Shape Pattern
  3. Add `repo/` subdirectory with database queries
  4. Add `service/` subdirectory with business logic (constructor DI, `handleX` public methods)
  5. Add `router/` subdirectory with Elysia routes using inline async handlers
  6. Export all from `index.ts`
  7. Add service class to `_registry.ts` with correct layer dependency
  8. Add route initialization to `_routes.ts`

## 🧪 Testing

### Backend Testing
- **Test Runner**: Bun's built-in test runner (`bun:test`)
- **Test Placement**: Colocate tests with source files using `.test.ts` suffix
- **Unit Tests**: Test services in isolation with mocked repos
- **Integration Tests**: Full app tests in `src/tests/integration/` hitting real routes
- **Mocking**: Use simple object mocks for services/repos (no complex frameworks needed)
- **Example Pattern**:
  ```typescript
  import { describe, expect, it } from 'bun:test'
  
  describe('MyService', () => {
    const mockRepo = { findById: async (id) => ({ id, name: 'test' }) }
    const service = new MyService(mockRepo)
    
    it('should fetch item', async () => {
      const result = await service.getItem(1)
      expect(result.name).toBe('test')
    })
  })
  ```

## 🔧 Common Development Workflows

### Adding a New Feature
1. Define DTOs in `dto/` (validation schemas)
2. Update schema in `src/db/schema.ts` if needed
3. Run `bun run db:generate` and review migration
4. Implement Service with repo dependency and business logic
5. Implement Router with route definitions and validation options
6. Register in `_registry.ts` and `_routes.ts`
7. Write unit tests for service, integration tests for routes
8. Run `bun run verify` before PR

### Database Changes
1. Modify schema in `src/db/schema.ts`
2. Run `bun run db:generate` (generates migration in `src/db/migrations/`)
3. Review the generated migration file
4. Run `bun run db:migrate` to apply changes locally
5. Commit both schema and migration files

### Debugging
- **Dev Mode**: Use `bun run dev:server` for rapid feedback on changes
- **Debugger**: Run `bun run dev:debug` and attach debugger to `localhost:6499` (VSCode: "Attach" launch config)
- **Database**: Use `bun run db:studio` for Drizzle Studio (visual DB inspector)
- **Logs**: Backend uses Pino logging with OpenTelemetry. Check console output in dev mode
- **Type Errors**: Run `bun run typecheck` to catch TS errors before runtime

---

## 🤖 Claude Code Integration Guide

This section provides guidance for AI agents (Claude Code) working with this codebase.

### Key Documentation References
- **ARCHITECTURE.md**: Complete system design (patterns, layer flow, performance optimization)
- **QUICK_REFERENCE.md**: Developer fast-track (templates, snippets, checklists)
- **ARCHITECTURE_DIAGRAMS.md**: Visual flows and diagrams
- **ARCHITECTURE_INDEX.md**: Navigation hub and quick lookup
- **CORE_UTILITY_REVIEW.md**: Core code review (gold standard patterns)
- **MODULE_REVIEW_CHECKLIST.md**: Module review framework (84-point checklist)

### Code Generation Principles for AI

#### 1. Always Verify Against Patterns
Before generating code, verify:
- Module structure (dto/, repo/, service/, router/)
- Layer dependencies (no upward imports)
- Naming conventions (handleX for service, camelCase functions, PascalCase classes)
- Type safety (no `any`, preserve generics)

#### 2. Reference Templates First
Use templates from QUICK_REFERENCE.md:
- DTO template (Zod with spread-shape)
- Repository template (QUERY / MUTATION / PRIVATE sections)
- Service template (handleX methods with caching)
- Router template (inline async functions)

#### 3. Validate Against Checklists
Before suggesting code, verify against:
- Type Safety Checklist (Type Safety section in QUICK_REFERENCE.md)
- Performance Checklist (Performance section in QUICK_REFERENCE.md)
- Testing Checklist (Testing section in QUICK_REFERENCE.md)

#### 4. Performance Optimization Rules
Never generate:
- ❌ Loops with N DB calls (use batch operations with inArray())
- ❌ Separate queries for relationships (use RelationMap for in-memory joins)
- ❌ Unoptimized caches (always invalidate on mutations)
- ❌ Duplicate code (extract to utilities)

Always generate:
- ✅ Batch operations (inArray(), updateMany(), deleteMany())
- ✅ Parallel queries (Promise.all for independent data)
- ✅ Cached reads (cache.getOrSet() with TTL)
- ✅ Smart cache invalidation (delete specific keys on mutations)

#### 5. Error Handling Rules
Never return null/undefined:
- ❌ `return user || null`
- ❌ `const result = await repo.getById(id); if (!result) return null`

Always throw errors:
- ✅ `const user = await repo.getById(id); if (!user) throw new NotFoundError('User', id)`
- ✅ Use specific error types: NotFoundError, ConflictError, BadRequestError, etc.

#### 6. Validation Rules
Always validate at boundaries:
- ✅ Route handler receives validated Zod schema
- ✅ No re-validation in service
- ✅ Use core validation helpers: zId, zc.email(), zc.password(), etc.

Never:
- ❌ Skip validation in route
- ❌ Duplicate validation in service

#### 7. Audit Trail Rules
Every write operation must include:
- ✅ `createdBy` or `updatedBy` with actorId
- ✅ `createdAt` or `updatedAt` timestamps
- ✅ Pass actorId from auth context through layers

#### 8. Telemetry Rules
Wrap all repository methods:
```typescript
return record('ServiceName.methodName', async () => {
  // actual logic
})
```

#### 9. Module Registration Rules
When creating new service:
1. Add to `src/modules/_registry.ts`: `export const entityService = new EntityService()`
2. Add to `src/modules/_routes.ts`: `app.use(entityRouter)`
3. Verify layer dependency in comment

#### 10. Testing Rules
Before suggesting code, have test plan:
- ✅ Unit test for service (mocked repo)
- ✅ Integration test for router (real service)
- ✅ Test happy path + error scenarios
- ✅ Test edge cases

### When to Ask for Clarification

Ask user if unclear about:
1. **Module layer placement** - Ask: "Which layer should this belong to? (Core, Master Data, Operations, Aggregators)"
2. **Dependency needs** - Ask: "Does this need data from other modules? If so, which ones?"
3. **Performance requirements** - Ask: "Expected volume for this operation? Any specific performance targets?"
4. **Caching strategy** - Ask: "How frequently does this data change? Should we cache it?"
5. **Authentication** - Ask: "Is this endpoint public or requires authentication?"

### Workflow: Code Generation with Claude Code

#### Step 1: Understand Requirements
- Read the feature request
- Check existing modules for similar patterns
- Review relevant documentation sections

#### Step 2: Design Phase
- Determine module layer and dependencies
- Sketch DTO/Entity structure
- Plan DB schema changes (if needed)
- Plan service methods needed
- Plan API endpoints

#### Step 3: Validate Design
- Check against MODULE_REVIEW_CHECKLIST.md
- Verify no circular dependencies
- Check layer compliance
- Confirm naming conventions

#### Step 4: Generate Code
- Start with DTOs (using template)
- DB schema + migration (if needed)
- Repository (using template)
- Service (using template)
- Router (using template)
- Tests

#### Step 5: Verify Generated Code
- Run `bun run typecheck` → Must pass
- Run `bun run lint` → Must pass
- Run `bun run test` → Must pass
- Run `bun run check-deps` → No circular deps

#### Step 6: Review
- Check against ARCHITECTURE.md patterns
- Verify checklists are all ✅
- Check performance is optimal
- Verify error handling is correct

### Common Patterns to Generate

See QUICK_REFERENCE.md for:
- [New Feature Checklist](#new-feature-checklist) (6-step template)
- [Common Code Snippets](#common-code-snippets) (15+ examples)
- [Batch Operations Pattern](#batch-operations-pattern)
- [Error Handling Quick Reference](#error-handling-quick-reference)

### Code Quality Standards

All generated code must:
- ✅ Pass TypeScript strict mode (`bun run typecheck`)
- ✅ Pass linting (`bun run lint`)
- ✅ Have no `any` types (except documented exceptions)
- ✅ Follow naming conventions (camelCase, PascalCase, UPPERCASE)
- ✅ Include error handling (throw errors, not return)
- ✅ Have audit trails (createdBy/updatedBy)
- ✅ Have telemetry wrapping (record() in repos)
- ✅ Be tested (unit + integration tests)
- ✅ Have no N+1 queries
- ✅ Use batch operations for bulk work
- ✅ Cache expensive reads (with invalidation)

### Red Flags (Don't Generate)

🚩 Loops with DB calls → Use batch operations instead
🚩 Multiple queries for relationships → Use RelationMap instead
🚩 Return null for missing records → Throw NotFoundError instead
🚩 Skip validation → Always validate at route boundary
🚩 Missing audit columns → Always include createdBy/updatedBy
🚩 Unwrapped repo methods → Always wrap with record()
🚩 Hardcoded magic numbers → Use constants instead
🚩 Duplicate code → Extract to utilities
🚩 Missing error handling → Use specific error types
🚩 No caching for expensive ops → Use bento.namespace() + invalidation

### Conversation Starters for AI

When user says "build a feature", confirm:
1. "Which module layer? (Core/Master Data/Operations/Aggregators)"
2. "Any dependencies on other modules?"
3. "Public or authenticated endpoint?"
4. "Expected data volume/performance targets?"
5. "Need complex relationships or simple CRUD?"

---

## 🎓 Learning Resources

### For Understanding Architecture
1. Start: ARCHITECTURE.md (Overview section)
2. Visual: ARCHITECTURE_DIAGRAMS.md (Request Flow diagram)
3. Deep: ARCHITECTURE.md (all sections)

### For Building Features
1. Template: QUICK_REFERENCE.md (New Feature Checklist)
2. Reference: QUICK_REFERENCE.md (Code templates)
3. Verify: MODULE_REVIEW_CHECKLIST.md

### For Code Review
1. Reference: ARCHITECTURE.md (Code Review Checklist)
2. Pattern: QUICK_REFERENCE.md (Common patterns)
3. Framework: MODULE_REVIEW_CHECKLIST.md

### For New Developers
1. Overview: ARCHITECTURE_INDEX.md
2. Visual: ARCHITECTURE_DIAGRAMS.md
3. Path: ARCHITECTURE_INDEX.md (Learning Path)

