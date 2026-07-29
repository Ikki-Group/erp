# Module Standard

The single source of truth for how a backend module is structured — if any other doc disagrees, this file wins.

## Reference modules

- **Simple** → `src/modules/location/` (one entity, flat files)
- **Complex** → `src/modules/iam/` (multiple entities, submodule folders + `composed/`)

## Layered dependency rule

Modules import downward only. `bun run check-deps` enforces no cycles.

```
Layer 3  Aggregators (dashboard, reporting)
   ↓
Layer 2  Operations (sales, purchasing, production, inventory, payment)
   ↓
Layer 1  Master data (iam, location, material, product, supplier, uom, crm, hr, finance)
   ↓
Layer 0  Core (auth, session)
```

- Lower layers MUST NOT import upper layers.
- Cross-cutting reads live in a `composed/` submodule, never by importing upward.
- Inject narrow interfaces across modules, not whole module objects.

## The template

```
modules/{module}/
├── {module}.schema.ts      # Zod schemas + inferred types (HTTP boundary)
├── {module}.repo.ts        # I{Module}Repo PORT + concrete class (Drizzle)
├── {module}.service.ts     # Business logic (depends on the PORT)
├── {module}.route.ts       # Thin Elysia routes → call handleX only
├── {module}.internal.ts    # {Module}Error factory (typed HTTP errors)
├── {module}.module.ts      # Factory: create{Module}Module(db, cache, deps)
└── index.ts                # Public exports (schema, port type, module type)
```

Complex modules split each entity into folders (`user/`, `role/`, …) with the same file set, plus an aggregate `{module}.module.ts`, `{module}.route.ts`, and a `composed/` submodule for cross-entity reads.

## Non-negotiable conventions

### Repository

| Rule            | Detail                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Declare port    | `I{Module}Repo` interface; class `implements` it                                                     |
| Expose db       | `readonly db: DbContext` (for `checkConflict`/`withTransaction`)                                     |
| Not-found reads | Return `T \| undefined` — never `null`, never throw                                                  |
| Write override  | Every write accepts `db?: DbContext = this.db` for transactions                                      |
| Verb names      | Reads: `findMany / findById / findByIds / findPage`. Writes: `insert / insertMany / update / remove` |

### Service

| Rule              | Detail                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Constructor       | `(repo, cacheClient)` for leaf; `(deps, repo, cacheClient)` when siblings needed                          |
| Depend on port    | Not the concrete repo class                                                                               |
| Narrow interfaces | Cross-module deps injected as typed picks, not whole modules                                              |
| `handleX`         | The ONLY methods routes call. Internal reuse uses plain verbs (`create`, `getById`)                       |
| Telemetry         | `record(...)` at ONE level — either `handleX` or the internal method, never both                          |
| Errors            | Throw `{Module}Error.*` (typed). Private `invalidate(id?)` for cache busting                              |
| Atomicity         | Multi-write operations use `withTransaction(this.repo.db, tx => …)`, threading `tx` into every repo write |

### checkConflict

Always pass `db: this.repo.db`. No global-db fallback.

### Route

Thin: validate via Zod DTO → call one `handleX` → wrap in `res.*`. Actor via `auth.userId`.

## Schema (Zod) rules

- Use spread-shape, NOT `.extend()`:

```ts
// correct
export const XUpdateSchema = z.object({ id: zp.id, ...XMutationSchema.shape })
// wrong
export const XUpdateSchema = XMutationSchema.extend({ id: z.number() })
```

- Entity schema includes audit via `...zc.AuditBasic.shape`.
- Extract a reusable `{Entity}MutationSchema` (private) for create/update fields.
- Filters use `...zq.pagination.shape` + `q: zq.search`.
- Export both schema and inferred type: `export type XSchema = z.infer<typeof XSchema>`.
- IDs are serial integers (`zp.id`), never UUIDs. Write id inline as `id: zp.id` in UpdateSchema.

### Validation primitives

| Prefix | Use for                  | Coerces? |
| ------ | ------------------------ | -------- |
| `zp.*` | Output / entity schemas  | No       |
| `zc.*` | Input / mutation schemas | No       |
| `zq.*` | Query params (GET)       | Yes      |

### Route input conventions

| Operation       | Input source | Schema                          |
| --------------- | ------------ | ------------------------------- |
| Detail / remove | query params | `zq.recordId` (coerced `{id}`)  |
| Create / update | body         | `CreateSchema` / `UpdateSchema` |
| Bulk remove     | body         | `{ ids }`                       |

## Error factory

Typed, centralized in `{module}.internal.ts`. Only errors actually thrown (no dead factories). Repos never throw — the service maps `undefined` to the right error.

```ts
export const LocationError = {
	notFound: (id: number) =>
		new NotFoundError('Location not found', { code: 'LOCATION_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Location creation failed', { code: 'LOCATION_CREATE_FAILED' }),
}
```

## Audit + cache rules

- Every mutation stamps the actor: `...stampCreate(actorId)` / `...stampUpdate(actorId)`.
- Every mutation invalidates cache via `invalidate(id?)`.
- Strip secrets (e.g. `passwordHash`) in the repo `select` before returning.
- Batch reads with `findByIds` + `inArray` + `RelationMap`. Never loop single `findById` (N+1).

## Wiring a new module

1. Write `{module}.module.ts` and `{module}.route.ts`.
2. In `_registry.ts`: add field to `Modules`, create in dependency order, add to return.
3. In `_routes.ts`: add `create{Module}Route(m.{module})`.
4. Schema changes → `db:generate` + `db:migrate`.
5. Gate: `bun run verify`.

## Documented exceptions

Not every folder is a CRUD entity module. Legitimate exceptions:

- **Third-party adapter** (e.g. `moka/engine/`): calls external API, no DB entity. Sibling sub-entity folders follow the standard.
- **No-repo orchestration** (e.g. `moka/scrap/`): composes existing services, persists nothing directly.
- **No-own-persistence** (e.g. `auth/`, `tool/`): orchestrates other modules without owning a table.

Document exceptions in a module-level `README.md`. Always provide a `create{Module}Module` factory.

## Migration checklist

Use when bringing an existing module up to standard:

- [ ] Repo declares `I{Module}Repo` port with `readonly db`
- [ ] Service depends on port, not concrete class
- [ ] Reads return `T | undefined`
- [ ] Correct verb names (`findMany/findById/findByIds/findPage`, `insert/update/remove`)
- [ ] Writes accept `db?: DbContext = this.db`
- [ ] `checkConflict({ db: this.repo.db, … })` — explicit db
- [ ] Multi-writes wrapped in `withTransaction`
- [ ] `handleX` are the only route entrypoints
- [ ] Private `invalidate(id?)` on every write
- [ ] Audit stamps on every mutation
- [ ] No dead error factories
- [ ] Cross-module deps as narrow interfaces
- [ ] `bun run typecheck && bun run check-deps` pass

---

**Next:** [03-code-standard.md](./03-code-standard.md) — Naming, imports, TypeScript style, HTTP conventions.
