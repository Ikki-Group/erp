---
name: feature-development
description: Build a new feature following architecture patterns
---

# Build a Feature

You are implementing a feature in the Ikki ERP server. Follow this workflow:

## Phase 1: Explore (Plan Mode)

1. Read existing similar module patterns:
   - Simple CRUD: @apps/server/src/modules/location/
   - Complex: @apps/server/src/modules/iam/
2. Understand architecture: @docs/ARCHITECTURE.md
3. Identify module layer and dependencies

## Phase 2: Plan

1. Determine layer (Layer 0/1/1.5/2/3)
2. Identify dependencies on other modules
3. Sketch DTO structure
4. Plan service methods (handleCreate, handleUpdate, etc.)
5. Plan API endpoints and auth needs
6. Create detailed implementation plan

## Phase 3: Implement (Normal Mode)

1. **DTOs**: Zod schemas with spread-shape pattern (never .extend())
2. **Database**: Update schema, run `bun run db:generate`, review migration
3. **Repository**: QUERY / MUTATION / PRIVATE sections
   - Wrap with `record()` for telemetry
   - Use `inArray()` for batch operations
4. **Service**: handleX methods with caching
   - Services own repos (dependency injection)
   - Cache reads with `bento.namespace()`
   - Invalidate caches on mutations
   - Include createdBy/updatedBy on all writes
5. **Router**: Inline async functions with Elysia
   - Use res.ok(), res.created(), res.paginated()
   - auth: true for protected routes
6. **Tests**: Unit + integration tests
7. **Registration**: Add to \_registry.ts and \_routes.ts

## Verification

1. `bun run typecheck` → 0 errors
2. `bun run lint` → 0 errors, 0 warnings
3. `bun run test` → All tests pass
4. `bun run verify` → All checks pass
5. `bun run check-deps` → No circular dependencies

## Red Flags

🚩 Loops with N DB calls → use inArray()
🚩 Separate queries for relationships → use RelationMap
🚩 Return null for missing → throw NotFoundError
🚩 Skip validation in route → validate at boundary
🚩 Missing audit columns → include createdBy/updatedBy
🚩 No error handling → throw specific errors
🚩 No caching for expensive ops → use bento with invalidation

## References

- @docs/ARCHITECTURE.md
- @docs/CODE_PATTERNS.md
- @docs/MODULE_CHECKLIST.md
