# Server Architecture

Broader system context for the Ikki ERP server: project structure, layers, data flow, and design philosophy.

## Design philosophy

1. **Solo developer velocity** — minimal ceremony, flat when possible.
2. **AI agent comprehension** — predictable structure, explicit patterns.
3. **Scalability** — grows with features without major refactors.
4. **Type safety** — TypeScript + Zod validation everywhere.

## Project structure

```
apps/server/
├── drizzle/                  # Auto-generated migrations
├── scripts/                  # Utility scripts (seed, helpers)
├── src/
│   ├── server.ts             # Entry point (Bun.serve)
│   ├── app.ts                # Elysia app instance + middleware
│   ├── config/               # Environment & constants (Zod-validated env)
│   ├── db/                   # Database layer (Drizzle schemas)
│   │   └── schema/           # Tables grouped by domain
│   ├── infra/                # Infrastructure services
│   │   ├── database/         # DB utils (pagination, conflict, query builder)
│   │   ├── cache/            # BentoCache wrapper
│   │   ├── logger/           # LogTape wrapper
│   │   └── otel/             # OpenTelemetry
│   ├── shared/               # Domain-agnostic utilities
│   │   ├── audit/            # stampCreate, stampUpdate
│   │   ├── errors/           # Custom error classes
│   │   ├── schema/           # Zod primitives (zp, zc, zq)
│   │   ├── http/             # Response helpers (res.ok, res.created)
│   │   ├── types/            # Global types (pagination, utils)
│   │   └── utils/            # Pure functions (RelationMap, money, password)
│   ├── server/               # Server plugins & handlers
│   │   ├── plugins/          # auth, request-id
│   │   └── handlers/         # error handler
│   ├── modules/              # Feature modules (vertical slices)
│   │   ├── _registry.ts      # DI container (composition root)
│   │   ├── _routes.ts        # Route aggregator
│   │   └── {module}/         # One per business domain
│   └── tests/                # Test files
│       ├── unit/             # Unit tests (in-memory fakes)
│       ├── services/         # Integration tests (real DB)
│       ├── setup.ts          # Test environment
│       └── helpers/          # Test utilities
├── drizzle.config.ts
├── tsconfig.json
└── package.json
```

## Architecture layers

### Layer 0: Infrastructure (`infra/`)

Core services that modules depend on. No business logic. Modules depend on this, not vice versa.

| Folder      | Purpose                                                              |
| ----------- | -------------------------------------------------------------------- |
| `database/` | DbContext type, pagination helpers, conflict checking, query builder |
| `cache/`    | BentoCache wrapper, CacheService class                               |
| `logger/`   | LogTape structured logger                                            |
| `otel/`     | OpenTelemetry tracing                                                |

### Layer 1: Shared (`shared/`)

Domain-agnostic utilities used across modules. Stateless functions. Can import from `infra/` and `types/`.

| Folder    | Purpose                                                        |
| --------- | -------------------------------------------------------------- |
| `audit/`  | `stampCreate`, `stampUpdate`                                   |
| `errors/` | `HttpError` hierarchy (400, 401, 403, 404, 409, 500)           |
| `schema/` | Zod primitives (`zp`, `zc`, `zq`) + response envelope builders |
| `http/`   | `res.ok`, `res.created`, `res.paginated` + `AuthContext`       |
| `utils/`  | `RelationMap`, money math, date helpers, password              |

### Layer 2: Database Schema (`db/`)

Drizzle table definitions grouped by domain. One file per domain. No business logic.

### Layer 3: Modules (`modules/`)

Vertical slices of business logic. See [02-module-standard.md](./02-module-standard.md) for structure rules.

## Data flow

```
HTTP Request
    ↓
[Route] *.route.ts — validates input with Zod
    ↓
[Service] *.service.ts — orchestrates business logic
    ↓
[Repo] *.repo.ts — executes DB queries
    ↓
[Database] Drizzle ORM → PostgreSQL
```

- **Routes** are thin wrappers: validate → call service → return.
- **Services** contain ALL business logic: cache, transactions, orchestration.
- **Repos** are PURE data access: no if/else, no throw, just DB queries.

## Module dependency layers

```
Layer 3  Aggregators   dashboard, reporting
Layer 2  Operations    sales, purchasing, production, inventory, payment, hr, moka
Layer 1  Master data   iam, location, material, product, supplier, uom, crm, finance, recipe
Layer 0  Core          auth, session
```

The composition root (`_registry.ts`) wires modules in topological order. Each module receives exactly the dependencies it needs as constructor args.

## Startup sequence

1. `server.ts` creates the cache client.
2. `createModules(db, cacheClient)` builds the module graph (composition root).
3. `createRoutes(modules)` assembles all HTTP route handlers.
4. `createApp(modules)` builds the Elysia app with middleware (error handler, OTEL, CORS, auth plugin).
5. `routes.register(app)` mounts all module routes.
6. `app.listen(...)` starts the HTTP server.

## Testing strategy

| Type        | Location              | Approach                                             |
| ----------- | --------------------- | ---------------------------------------------------- |
| Unit        | `src/tests/unit/`     | Typed in-memory fake implementing repo port. No DB.  |
| Integration | `src/tests/services/` | Real module graph via `testCtx.m.*` against test DB. |

Unit tests cover service logic in isolation. Integration tests verify critical HTTP/business flows end-to-end.

---

**Next:** [02-module-standard.md](./02-module-standard.md) — Non-negotiable module rules.
