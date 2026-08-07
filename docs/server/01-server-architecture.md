# Server Architecture

System design and layering for the Ikki ERP backend.

## Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Bun |
| Framework | Elysia |
| Database | PostgreSQL |
| ORM | Drizzle |
| Cache | Redis via BentoCache |
| Validation | Zod |
| Auth | Session-based (Redis) |
| Telemetry | OpenTelemetry (record wrapper) |

## Project Layout

```
apps/server/
├── src/
│   ├── app.ts                  # Elysia app + plugin registration
│   ├── modules/                # Vertical slices (one dir per domain)
│   │   ├── auth/
│   │   ├── iam/
│   │   ├── location/
│   │   ├── material/
│   │   ├── menu-item/
│   │   ├── uom/
│   │   ├── supplier/
│   │   ├── recipe/
│   │   ├── pos/
│   │   ├── inventory/
│   │   ├── finance/
│   │   ├── hr/
│   │   ├── crm/
│   │   └── company/
│   ├── db/
│   │   ├── schema/             # Drizzle table definitions
│   │   ├── migrations/         # Generated migrations
│   │   └── index.ts            # DB client
│   ├── infra/                  # Cross-cutting (database utils, cache, errors)
│   ├── shared/                 # Schema primitives, types, helpers
│   └── tests/                  # Integration + unit tests
├── drizzle.config.ts
└── package.json
```

## Module Dependency Layers

```
Layer 3  Aggregators   dashboard, reporting
Layer 2  Operations    pos, inventory, finance, hr, crm
Layer 1  Master data   iam, location, material, menu-item, uom, supplier, recipe
Layer 0  Core          auth, session, company
```

**Rule:** Modules only import from the same layer or below. Never upward.

## Request Flow

```
HTTP Request
  → Elysia route (validate query/body via Zod)
  → authPluginMacro (session check, location context)
  → service.handleX(data, actorId)
      → business logic
      → repo.method(data, tx?)
      → cache invalidation
      → audit stamps
  → res.ok(result) / res.created(result) / res.paginated(result)
```

## Location Context

Every authenticated request carries `auth.locationId` (from session). Services use this to scope data:

```ts
// Route extracts location from session
async ({ auth }) => {
  const result = await m.handleList(query, auth.locationId)
  return res.paginated(result)
}
```

## Cross-Module Communication

- **Allowed:** Import another module's service (via DI) for reads.
- **Allowed:** Call another module's internal method for side effects.
- **Not allowed:** Import another module's repo directly.
- **Not allowed:** Access another module's database tables directly.

## Error Handling

- Typed error factories per module (`LocationError.notFound(id)`).
- HTTP errors: `NotFoundError`, `ConflictError`, `ForbiddenError`, `ValidationError`.
- Global error handler maps to HTTP status codes.

## Caching Strategy

- Read-through: `cache.getOrSet` / `cache.getOrSetWithSkip`.
- Invalidation: `cache.invalidateStandard()` after every mutation.
- Cache keys: `{module}:byId:{id}`, `{module}:list`, `{module}:count`.

## Testing Strategy

| Type | Location | Approach |
|------|----------|----------|
| Unit | `src/tests/unit/` | Typed in-memory fake implementing repo port. No DB. |
| Integration | `src/tests/services/` | Real DB (test container), full service + repo. |
| E2E | `apps/e2e/` | Playwright against running server + web. |

---

**Next:** [02-module-standard.md](./02-module-standard.md) — Module structure.
