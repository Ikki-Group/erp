# Module Standard (Reference Pattern)

**This is the single source of truth for how a backend module is structured.**
Copy from the two reference modules:

- **Simple module** → `src/modules/location/` (one entity, flat files)
- **Complex module** → `src/modules/iam/` (multiple entities, submodule folders + `composed/`)

> If any other doc disagrees with this file, **this file wins.** The previous
> mixed-style docs (the old "Golden Path" architecture/template/patterns set)
> have been retired.

**Related, still-valid docs:**

- `MODULE_CHECKLIST.md` — step-by-step build checklist (aligned to these rules).
- `../database/SCHEMA_CONVENTIONS.md` — DB schema/naming/index rules.

---

## 0. Layered dependency rule (no cycles)

Modules import **downward only**. `bun run check-deps` enforces no cycles.

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
- Cross-cutting reads that join multiple entities live in a `composed/` submodule
  (see `iam/composed/`), never by having a lower module import an upper one.
- Inject **narrow interfaces** across modules, not whole module objects.

---

## 1. The one template

```
modules/{module}/
├── {module}.contract.ts   # Zod DTOs + inferred types (HTTP boundary)
├── {module}.repo.ts       # I{Module}Repo PORT + concrete class (Drizzle)
├── {module}.service.ts    # business logic (depends on the PORT, not the class)
├── {module}.route.ts      # thin Elysia routes → call handleX only
├── {module}.internal.ts   # {Module}Error factory (typed HTTP errors)
├── {module}.module.ts     # factory: create{Module}Module(db, cache, deps)
└── index.ts               # public exports (contract, port type, module type)
```

Complex modules split each entity into its own folder (`user/`, `role/`, …) with
the same file set, an aggregate `{module}.module.ts` + `{module}.route.ts`, and a
`composed/` submodule for cross-entity reads (joins). See `iam/`.

---

## 2. Non-negotiable conventions

| Layer             | Rule                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Repo**          | Declare an `I{Module}Repo` **interface (port)**; the class `implements` it. Services depend on the **port**.                           |
| **Repo**          | Expose `readonly db: DbContext` so services can pass it to `checkConflict` / `withTransaction`.                                        |
| **Repo**          | Reads return `T \| undefined` for not-found. **Never `null`, never throw.**                                                            |
| **Repo**          | Every write accepts an optional `db?: DbContext = this.db` override for transactions.                                                  |
| **Repo**          | Read verbs: `findMany / findById / findByIds / findPage`. Writes: `insert / insertMany / update / remove`.                             |
| **Service**       | Constructor: `(deps, repo, cacheClient)` when it has sibling deps; `(repo, cacheClient)` for a leaf service. `deps` is a typed object. |
| **Service**       | Depend on **narrow interfaces**, not whole modules (see `IamAuthPort` in `auth.service.ts`).                                           |
| **Service**       | `handleX` = the ONLY methods routes call. Internal reuse methods use plain verbs (`create`, `getById`).                                |
| **Service**       | Wrap the telemetry span (`record(...)`) at ONE level — either `handleX` OR the internal method, never both.                            |
| **Service**       | Throw `{Module}Error.*` (typed). Use a private `invalidate(id?)` helper for cache busting.                                             |
| **Service**       | Multi-write operations MUST be atomic via `withTransaction(this.repo.db, tx => …)`, threading `tx` into every repo write.              |
| **checkConflict** | Always pass `db: this.repo.db`. There is no global-db fallback.                                                                        |
| **Route**         | Thin: validate via Zod DTO → call one `handleX` → wrap in `res.*`. Actor via `auth.userId`.                                            |

---

## 3. Repository port (copy this)

```ts
// {module}.repo.ts
export interface ILocationRepo {
	readonly db: DbContext
	findMany(filter?: LocationFilterDto, db?: DbContext): Promise<LocationDto[]>
	findById(id: number, db?: DbContext): Promise<LocationDto | undefined>
	findPage(filter: LocationFilterDto, db?: DbContext): Promise<WithPaginationResult<LocationDto>>
	insert(data: LocationInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: LocationUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class LocationRepo implements ILocationRepo {
	constructor(readonly db: DbContext) {}
	async findById(id: number, db: DbContext = this.db) {
		/* … */
	}
	// …
}
```

## 4. Service create/update (conflict + atomic)

```ts
async create(data: DtoWithHash, actorId: ActorId): Promise<EntityRef> {
  await checkConflict({ db: this.repo.db, table, pkColumn, fields, input: data })

  const result = await withTransaction(this.repo.db, async (tx) => {
    const created = await this.repo.insert({ ...data, ...stampCreate(actorId) }, tx)
    if (!created) throw XError.createFailed()
    await this.deps.child.replaceByParentId(created.id, /* … */ actorId, tx) // same tx
    return created
  })

  await this.invalidate()
  return result
}
```

---

## 5. Testing (unit-first)

- **Unit tests** (`src/tests/unit/*.service.test.ts`): instantiate the service with a
  **typed in-memory fake** implementing the repo port — no DB, no `as any`.
  Reference: `location.service.test.ts`, `iam-composed.service.test.ts`.
  - The only infra seam that still touches `db` is `checkConflict`; give the fake
    a tiny `db` stub whose `select().from().where().limit()` returns `[]`.
- **Integration tests** (`src/tests/services/*.test.ts`): build the real module graph
  via `testCtx.m.*` against the test DB for critical HTTP/business flows.
  Reference: `iam.test.ts`.
- Assert async rejection with the `expectReject(promise)` helper (the type-aware
  linter doesn't recognize bun's `.rejects` as thenable).

---

## 6. Wiring a new module

1. Write `{module}.module.ts` (`create{Module}Module`) and, if it has an API,
   `{module}.route.ts` (`create{Module}Route`).
2. In `modules/_registry.ts`: add the field to `Modules`, create it **in
   dependency order** (see the topological comment there), add it to the return.
3. In `modules/_routes.ts`: add `create{Module}Route(m.{module})` (only if it has HTTP).
4. Schema changes → `db:generate` + `db:migrate`. Contract changes → `generate:endpoints` / `generate:web`.
5. Gate: `bun run verify` + `bun run check-deps`.

---

## 7. Contract (Zod) rules

- Use **spread-shape** composition, NOT `.extend()` (`.extend()` breaks inference):

  ```ts
  // ✅ good
  export const XUpdateDto = z.object({ ...zc.RecordId.shape, ...XMutationDto.shape })
  // ❌ bad
  export const XUpdateDto = XMutationDto.extend({ id: z.number() })
  ```

- Entity DTO includes audit fields via `...zc.AuditBasic.shape`.
- Extract a reusable `{Entity}MutationDto` for the create/update field set.
- Filters use `...zq.pagination.shape` + `q: zq.search`.
- Export both the schema and its inferred type: `export type XDto = z.infer<typeof XDto>`.
- IDs are serial integers (`zp.id`), never UUIDs.

## 8. Error factory (`{module}.internal.ts`)

Typed, centralized, and **only errors that are actually thrown** (no dead factories):

```ts
export const LocationError = {
  notFound: (id: number) =>
    new NotFoundError('Location not found', { code: 'LOCATION_NOT_FOUND', context: { id } }),
  createFailed: () =>
    new InternalServerError('Location creation failed', { code: 'LOCATION_CREATE_FAILED' }),
}
```

Repos never throw; services translate `undefined` → the right typed error.

## 9. Audit + cache rules

- Every mutation stamps the actor: `...stampCreate(actorId)` / `...stampUpdate(actorId)`.
- Every mutation invalidates cache via the private `invalidate(id?)` helper.
- Never leak secrets: strip `passwordHash`-like columns before returning from a read
  (do it in the repo `select`, and the return type must match).
- Batch reads with `findByIds` + `inArray` + `RelationMap`; never loop single `findById` (N+1).

---

## 10. Per-module migration checklist

Use this when bringing an existing module up to standard (for `location`/`iam` as done reference):

- [ ] Repo declares `I{Module}Repo` port with `readonly db`; class `implements` it.
- [ ] Service constructor typed as the **port**, not the concrete repo class.
- [ ] All reads return `T | undefined` (fix any `null` returns).
- [ ] Read verbs `findMany/findById/findByIds/findPage`; write verbs `insert/insertMany/update/remove`.
- [ ] Writes accept `db?: DbContext = this.db`.
- [ ] `checkConflict({ db: this.repo.db, … })` — explicit db, no global.
- [ ] Multi-write ops wrapped in `withTransaction(this.repo.db, tx => …)`.
- [ ] `handleX` are the only route entrypoints; no double `record()` spans.
- [ ] Private `invalidate(id?)` helper; every write calls it.
- [ ] Audit stamps on every mutation.
- [ ] No dead error factories; NotFound shape consistent within the module.
- [ ] Cross-module deps injected as narrow interfaces, not whole modules.
- [ ] Unit test with a typed in-memory fake (no `as any`); integration test for critical flow.
- [ ] `bun run typecheck && bun run check-deps` pass (no NEW errors).

