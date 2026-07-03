# Module Standard (Reference Pattern)

**This is the single source of truth for how a backend module is structured.**
Copy from the two reference modules:

- **Simple module** → `src/modules/location/` (one entity, flat files)
- **Complex module** → `src/modules/iam/` (multiple entities, submodule folders + `composed/`)

> If any older doc (ARCHITECTURE.md, MODULE_TEMPLATE.md, CODE_PATTERNS.md)
> disagrees with this file, **this file wins**. Older docs describe the previous
> mixed styles and are being retired.

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
