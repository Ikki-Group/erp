# Module Checklist

Step-by-step guide to create a new module, aligned to [02-module-standard.md](./02-module-standard.md).

## Pre-implementation

- [ ] Define module name (kebab-case directory)
- [ ] Identify entities and determine complexity (simple vs complex)
- [ ] Identify dependencies — verify layer (no upward imports)
- [ ] List unique fields for conflict checking
- [ ] List business rules

## File structure

### Simple module

```bash
src/modules/{module}/
├── {module}.contract.ts
├── {module}.repo.ts
├── {module}.service.ts
├── {module}.route.ts
├── {module}.internal.ts
├── {module}.module.ts
└── index.ts
```

### Complex module

```bash
src/modules/{module}/
├── {module}.module.ts      # Aggregate factory
├── {module}.route.ts       # Aggregate routes
├── index.ts
├── constants.ts            # Module-wide constants (if needed)
├── {sub-1}/
│   ├── {sub-1}.contract.ts
│   ├── {sub-1}.repo.ts
│   └── {sub-1}.service.ts
├── {sub-2}/
│   └── ...
└── composed/               # Cross-submodule reads (JOINs)
    ├── composed.repo.ts
    └── composed.service.ts
```

## Implementation steps

### Step 1: Contract

- [ ] Define entity DTO with `zp.*` + `...zc.AuditBasic.shape`
- [ ] Define filter DTO with `...zq.pagination.shape` + `q: zq.search`
- [ ] Extract `{Entity}MutationDto` with `zc.*`
- [ ] Define `CreateDto = MutationDto`
- [ ] Define `UpdateDto = z.object({ id: zp.id, ...MutationDto.shape })`
- [ ] Export schemas + inferred types

### Step 2: Repository

- [ ] Declare `I{Module}Repo` port with `readonly db: DbContext`
- [ ] Implement `findById(id, db?)` → `T | undefined`
- [ ] Implement `findByIds(ids, db?)` (guard empty array)
- [ ] Implement `findPage(filter, db?)` via `paginateWindow`
- [ ] Implement `insert(data, db?)` → `EntityRef | undefined`
- [ ] Implement `update(id, data, db?)`
- [ ] Implement `remove(id, db?)`
- [ ] All writes accept `db?: DbContext = this.db`

### Step 3: Service

- [ ] Depend on the port (not the class)
- [ ] Initialize `CacheService` with namespace
- [ ] Define `uniqueFields` for conflict checking
- [ ] Implement `create` (checkConflict → insert with stampCreate → invalidate)
- [ ] Implement `update` (check exists → checkConflict with existing → update with stampUpdate → invalidate)
- [ ] Implement `remove` (remove → invalidate)
- [ ] Implement `getById` (cache read-through)
- [ ] Implement `handleX` wrappers with `record(...)` span
- [ ] Private `invalidate(id?)` helper

### Step 4: Internal errors

- [ ] Define `{Module}Error` factory with only errors actually thrown
- [ ] Use `NotFoundError`, `ConflictError`, `InternalServerError`
- [ ] Include `code` and `context` in every error

### Step 5: Module factory

- [ ] Define `create{Module}Module(db, cacheClient, deps?)` factory
- [ ] Instantiate repo → service → return

### Step 6: Routes

- [ ] `create{Module}Route(m)` with `new Elysia({ prefix: '/{module}' })`
- [ ] `.use(authPluginMacro)` + `auth: true` on every endpoint
- [ ] GET `/list` → `res.paginated`, query: FilterDto
- [ ] GET `/detail` → `res.ok`, query: `zq.recordId`
- [ ] POST `/create` → `res.created`, body: CreateDto
- [ ] PUT `/update` → `res.ok`, body: UpdateDto
- [ ] DELETE `/remove` → `res.ok`, query: `zq.recordId`
- [ ] Declare `response:` DTO on every endpoint

### Step 7: Public API (`index.ts`)

- [ ] Export contract DTOs
- [ ] Export port type (`type { I{Module}Repo }`)
- [ ] Export module type and factory

## Integration

### Step 8: Register module

- [ ] `_registry.ts`: add field to `Modules`, create in dependency order, return
- [ ] `_routes.ts`: add `create{Module}Route(m.{module})`

### Step 9: Database

- [ ] Create/update schema in `db/schema/`
- [ ] Include audit fields + indexes + FK constraints
- [ ] `bun run db:generate` → review migration → `bun run db:migrate`

## Testing

### Step 10: Write tests

- [ ] Unit test: `src/tests/unit/{module}.service.test.ts`
  - Typed in-memory fake implementing port (no `as any`)
  - Test create (success + conflict), update (success + not-found + conflict), getById, delete
- [ ] Integration test: `src/tests/services/{module}.test.ts`
  - Real module graph against test DB for critical flows

## Verification

### Step 11: Gate

```bash
bun run verify    # lint + typecheck + knip + check-deps
bun run test      # all tests pass
```

## Common pitfalls

| Pitfall                          | Fix                                                 |
| -------------------------------- | --------------------------------------------------- |
| Using `.extend()` on Zod schemas | Use spread-shape                                    |
| Throwing in repo                 | Return `undefined`, let service decide              |
| Forgetting cache invalidation    | Every mutation calls `invalidate(id?)`              |
| Missing conflict checks          | `checkConflict` on create AND update                |
| Missing audit stamps             | `stampCreate`/`stampUpdate` on every write          |
| N+1 queries                      | `findByIds` + `inArray` + `RelationMap`             |
| Circular dependencies            | Check layer; use `composed/` for cross-entity reads |
| Empty array in `inArray`         | Guard: `if (ids.length === 0) return []`            |

---

**Next:** [readme.md](./readme.md) — Back to the index.
