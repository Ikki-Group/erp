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
4. Schema changes → `db:generate` + `db:migrate`.
5. Gate: `bun run verify` + `bun run check-deps`.

---

## 7. Contract (Zod) rules

- Use **spread-shape** composition, NOT `.extend()` (`.extend()` breaks inference):

  ```ts
  // ✅ good
  export const XUpdateDto = z.object({ id: zp.id, ...XMutationDto.shape })
  // ❌ bad
  export const XUpdateDto = XMutationDto.extend({ id: z.number() })
  ```

- Entity DTO includes audit fields via `...zc.AuditBasic.shape`.
- Extract a reusable `{Entity}MutationDto` for the create/update field set.
- Filters use `...zq.pagination.shape` + `q: zq.search`.
- Export both the schema and its inferred type: `export type XDto = z.infer<typeof XDto>`.
- IDs are serial integers (`zp.id`), never UUIDs. Write the id field **inline as
  `id: zp.id`** in Update DTOs (not `...zc.RecordId.shape`).

### Validation primitives: `zp` vs `zc` vs `zq`

| Prefix | Use for                       | Coerces? | Examples                                         |
| ------ | ----------------------------- | -------- | ------------------------------------------------ |
| `zp.*` | **output / entity** DTOs      | no       | `zp.str`, `zp.id`, `zp.bool`, `zp.date`          |
| `zc.*` | **input / mutation** DTOs     | no       | `zc.strTrim`, `zc.email`, `zc.password`          |
| `zq.*` | **query** params (GET)        | **yes**  | `zq.recordId`, `zq.ids`, `zq.pagination`, `zq.search` |

Query strings always arrive as text, so a `{ id }` read via **query** MUST use
`zq.recordId` (coerces `"1"` → `1`), never `zc.RecordId` (raw `number`, would reject).

### Route input conventions

| Operation        | Input source | Schema                                                   |
| ---------------- | ------------ | -------------------------------------------------------- |
| `detail` `{id}`  | query params | `zq.recordId`                                            |
| `remove` `{id}`  | query params | `zq.recordId`                                            |
| bulk remove      | body         | `{ ids }` (`zq.ids` shape) — convention only, not built  |
| `create`/`update`| body         | `<Entity>CreateDto` / `<Entity>UpdateDto`                |

Single `detail`/`remove` take `{ id }` via **query** (coerced). Bulk operations
take a payload via **body**. The response is never validated against the input
schema — output DTOs (`zp.*`) and input DTOs (`zc.*`) are separate on purpose.

> **Contract files hold HTTP DTOs only.** A persistence-only shape (e.g.
> `UserWithPasswordDto`, which carries `passwordHash`) may live in the contract
> file but MUST be commented as internal and never returned from a route.

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

---

## 11. Documented exceptions

Not every folder under `modules/` is a CRUD entity module. Some are legitimate
architectural exceptions to this template. Document them explicitly (in a
module-level `README.md` and/or a comment) rather than force-fitting the
template — but the exception must be a conscious, written decision, not an
unreviewed gap.

**Third-party API integration adapter** (e.g. `moka/engine/`): a folder that
only calls an external service's API (auth, fetch, sync) and has no persisted
entity of its own. It has no `.contract.ts`/`.repo.ts`/`.module.ts`/`index.ts`
because there is nothing to model as a DB-backed entity — all persistence for
that integration lives in sibling sub-entity folders (e.g. `moka/configuration/`,
`moka/scrap/scrap-history/`, `moka/scrap/scrap-sync-cursor/`), which do follow
the standard. See `apps/server/src/modules/moka/README.md` for the worked
example (`engine/` = Moka POS API adapter, no DB pattern; `configuration/`,
`scrap-history/`, `scrap-sync-cursor/` = standard sub-entity modules).

**No-repo orchestration service** (e.g. `moka/scrap/scrap.service.ts`,
`moka/scrap/scrap-transformation.service.ts`): a service that composes other
already-existing services/modules and has no repository of its own because it
persists nothing directly, or (for `scrap-transformation.service.ts`
specifically) is a boundary-adapter layer that intentionally takes `db`
directly instead of a repo port, to perform complex multi-table bulk writes
under direct transaction control. Its `.module.ts` factory takes the sibling
services as `deps` instead of constructing a `Repo`.

**No-own-persistence modules** (e.g. `auth/`, `tool/`): modules that
orchestrate other modules (session, iam, seeding) without owning a table of
their own. No `.repo.ts` is expected; the module still gets a `.module.ts`
factory and, where it has a route surface, a `.route.ts`.

When adding a new exception, prefer the narrowest carve-out (skip only the
file that doesn't apply, e.g. no `.repo.ts`) over skipping the whole template.
Always still provide a `create{Module}Module` **factory function** for
wiring — class-wrapper wiring is never an accepted exception.

