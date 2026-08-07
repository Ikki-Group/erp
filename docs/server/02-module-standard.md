# Module Standard

The single source of truth for how server modules are structured.

## Reference Modules

- **Simple** → `src/modules/location/` (one entity, flat files)
- **Complex** → `src/modules/iam/` (multiple entities, submodule folders + `composed/`)

## Simple Module (flat)

```
src/modules/location/
├── location.contract.ts    # Zod schemas (DTOs)
├── location.repo.ts        # Database access (port + class)
├── location.service.ts     # Business logic
├── location.route.ts       # Elysia routes
├── location.internal.ts    # Error factories, constants
├── location.module.ts      # Factory: wires repo + service + route
└── index.ts                # Public export (module factory)
```

## Complex Module (sub-entities)

```
src/modules/iam/
├── iam.module.ts           # Aggregate factory
├── iam.route.ts            # Aggregate route (combines sub-routes)
├── index.ts
├── user/
│   ├── user.contract.ts
│   ├── user.repo.ts
│   ├── user.service.ts
│   └── user.internal.ts
├── role/
│   ├── role.contract.ts
│   ├── role.repo.ts
│   ├── role.service.ts
│   └── role.internal.ts
└── composed/               # Cross-entity reads (JOINs)
    ├── composed.contract.ts
    ├── composed.repo.ts
    └── composed.service.ts
```

## Layer Rules

```
Layer 3  Aggregators (dashboard, reporting)
   ↓
Layer 2  Operations (pos, inventory, production, finance, hr, crm)
   ↓
Layer 1  Master data (iam, location, material, menu, uom, supplier, recipe, payment-method)
   ↓
Layer 0  Core (auth, company, audit)
```

- Import **downward** only (Layer 2 can import Layer 1, not vice versa).
- Same-layer imports are allowed (e.g. `recipe` imports `material`).
- Cross-module dependency via service injection, never direct repo access.

## File Responsibilities

| File            | Responsibility                                       |
| --------------- | ---------------------------------------------------- |
| `*.contract.ts` | Zod schemas: DTOs, enums, filters. No logic.         |
| `*.repo.ts`     | Port interface + implementation. DB queries only.    |
| `*.service.ts`  | Business logic, validation, orchestration.           |
| `*.route.ts`    | HTTP layer. Validation → handleX → response wrapper. |
| `*.internal.ts` | Error factories, module constants. Not exported.     |
| `*.module.ts`   | Wires dependencies. Creates service + repo + route.  |
| `index.ts`      | Public API. Exports module factory only.             |

## Module Factory Pattern

```ts
// location.module.ts
export function createLocationModule(db: DbContext, cache: CacheClient) {
	const repo = new LocationRepo(db)
	const service = new LocationService(repo, cache)
	const route = createLocationRoute(service)
	return { route, service }
}
```

---

**Next:** [03-code-standard.md](./03-code-standard.md) — Naming and style.
