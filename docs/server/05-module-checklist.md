# Module Checklist

Step-by-step guide to create a new module.

## Pre-Implementation

- [ ] Define module name (kebab-case directory)
- [ ] Identify entities and complexity (simple vs complex)
- [ ] Identify dependencies — verify layer (no upward imports)
- [ ] List unique fields for conflict checking
- [ ] List business rules

## File Structure

### Simple

```
src/modules/{module}/
├── {module}.contract.ts
├── {module}.repo.ts
├── {module}.service.ts
├── {module}.route.ts
├── {module}.internal.ts
├── {module}.module.ts
└── index.ts
```

### Complex

```
src/modules/{module}/
├── {module}.module.ts
├── {module}.route.ts
├── index.ts
├── {sub-1}/
│   ├── {sub-1}.contract.ts
│   ├── {sub-1}.repo.ts
│   ├── {sub-1}.service.ts
│   └── {sub-1}.internal.ts
├── {sub-2}/
│   └── ...
└── composed/
    ├── composed.contract.ts
    ├── composed.repo.ts
    └── composed.service.ts
```

## Implementation Steps

1. **Schema** — Define Drizzle table in `src/db/schema/{domain}.ts`
2. **Contract** — Zod DTOs (Entity, Create, Update, Filter)
3. **Repo** — Interface + implementation (CRUD + pagination)
4. **Internal** — Error factories
5. **Service** — Business logic + cache + audit stamps
6. **Route** — Elysia handlers (thin: validate → handleX → res.*)
7. **Module** — Factory wiring repo + service + route
8. **Index** — Export module factory
9. **Register** — Add route to app.ts
10. **Test** — Integration test in `src/tests/`

## Post-Implementation

- [ ] Run `bun run verify` (lint + typecheck + knip + check-deps)
- [ ] Run `bun run test` (ensure no regressions)
- [ ] Update `docs/database/` if schema changed
- [ ] Commit with conventional prefix

---

**Next:** [readme.md](./readme.md) — Back to server index.
