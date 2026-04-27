# Module Review Checklist — Golden Path 2.0

> Full standards: [SERVER_STANDARDS.md](./SERVER_STANDARDS.md)

---

## Phase 1: Structure

- [ ] Co-located files: `dto/`, `entity.repo.ts`, `entity.service.ts`, `entity.route.ts`, `*.test.ts`
- [ ] Naming: files (kebab-case), classes (PascalCase), methods (camelCase), DTOs (Dto suffix)
- [ ] NO `export *` from root `index.ts` — only Module class + Services interface
- [ ] Import DTOs direct: `@/modules/xxx/dto/entity.dto`

---

## Phase 2: Service

- [ ] `get*()` for services, `handle*()` for router only
- [ ] `repo` is `private readonly` — never exposed
- [ ] `clearCache()` is private — always called after write
- [ ] Use `CACHE_KEY_DEFAULT` from `@/core/cache`
- [ ] NO `usecase/` folder — orchestration in service
- [ ] Cross-module deps via lazy getter `() => dep`

---

## Phase 3: Repository

- [ ] NO business logic (no validation, no caching)
- [ ] Every method wrapped with `record('ClassName.methodName', ...)`
- [ ] Batch fetch with `inArray()`, not loops
- [ ] Use `paginate()`, `searchFilter()` from `@/core/database`
- [ ] Use `stampCreate()`, `stampUpdate()` for audit columns
- [ ] Multi-step mutations use `db.transaction()`

---

## Phase 4: Router

- [ ] `initXxxRoute(service)` function, co-located file
- [ ] Router calls ONLY `service.handle*()` — never `get*()`
- [ ] Endpoints: GET /list, GET /detail, POST /create, PUT /update, DELETE /remove
- [ ] Response: `res.paginated()` for lists, `res.ok()` for single
- [ ] Protected endpoints have `auth: true`, use `auth.userId` as `actorId`

---

## Phase 5: Type Safety

- [ ] NO `any`, all params/returns typed, no `!` without reason
- [ ] Use spread-shape for Zod: `{ ...Base.shape, ...Extra.shape }`
- [ ] Response schema in route options
- [ ] Service throws errors (never return null/undefined for errors)
- [ ] Route handlers NO try/catch (let framework handle)

---

## Phase 6: Validation

- [ ] All routes have typed `body`/`query` with DTO
- [ ] CREATE: `checkConflict({ input: data })` without `existing`
- [ ] UPDATE: `checkConflict({ input: data, existing })` with `existing`
- [ ] `conflictFields` at module-level constant
- [ ] All writes include `actorId`

---

## Phase 7: Performance

- [ ] NO N+1 queries (use `inArray()` + `RelationMap`)
- [ ] Parallel queries with `Promise.all()`
- [ ] Cache frequently-read data with `bento.getOrSet()`
- [ ] List endpoints have pagination

---

## Phase 8: Testing

- [ ] Co-located tests: `entity.service.test.ts`, `entity.route.test.ts`
- [ ] Skip DTO tests — validated via routes
- [ ] Service: inject fake repo via constructor
- [ ] Route: mock auth with `createMockAuthPlugin()`, mock service
- [ ] Test response format + auth rejection

---

## Phase 9: Quality

- [ ] `bun run typecheck` zero errors
- [ ] `bun test` passing
- [ ] No unused imports/variables (knip clean)
- [ ] NO hardcoded cache keys — use `CACHE_KEY_DEFAULT`

---

## 📊 Scoring

```
Phase 1 (Structure):         __ / 10
Phase 2 (Service Layer):     __ / 15
Phase 3 (Repository):        __ / 10
Phase 4 (Router):            __ / 10
Phase 5 (Type Safety):       __ / 8
Phase 6 (Validation):        __ / 7
Phase 7 (Performance):       __ / 5
Phase 8 (Testing):           __ / 10
Phase 9 (Quality):           __ / 5

TOTAL:                       __ / 80
```

### Score Interpretation

| Score | Verdict |
|-------|---------|
| 80/80 | 🟢 Production-ready, gold standard |
| 65–79 | 🟢 Ship with confidence |
| 50–64 | 🟡 Minor improvements before merge |
| 35–49 | 🟡 Needs work, address before shipping |
| < 35  | 🔴 Major revisions required |

---

## Anti-patterns

❌ Router calls `get*()` → use `handle*()`
❌ `repo` is public → use `private readonly`
❌ `clearCache()` is public → use `private`
❌ Root `index.ts` has `export *` → only export Module class
❌ Usecase layer for simple CRUD → router → service direct
❌ Cache invalidation missed → always call `clearCache()` after write
