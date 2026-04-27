# 📋 Module Review Checklist

Gunakan checklist ini untuk review modules `src/modules/*` sesuai standar **Golden Path 2.0**.

> **Note**: For complete standards, see [SERVER_STANDARDS.md](./SERVER_STANDARDS.md)

---

## ✅ Phase 1: Structure & Organization

- [ ] **Directory Structure (Co-located — No Subfolders)**
  - [ ] `/dto/` — Zod schemas (satu folder untuk semua DTOs)
  - [ ] `entity.repo.ts` — Drizzle queries (co-located)
  - [ ] `entity.service.ts` — Business logic (co-located)
  - [ ] `entity.route.ts` — HTTP handlers (co-located)
  - [ ] `entity.service.test.ts` — Service tests (co-located)
  - [ ] `entity.route.test.ts` — Route tests (co-located)
  - [ ] `constants.ts` — Cache keys & config
  - [ ] `errors.ts` — Domain error factories
  - [ ] `index.ts` — **Public API only** (hanya Module class + Services interface)

- [ ] **Naming Consistency**
  - [ ] Files: lowercase + hyphens (`user.repo.ts`, `user.service.ts`)
  - [ ] Classes: PascalCase (`UserService`, `UserRepo`)
  - [ ] Methods: camelCase (`handleCreate()`, `getById()`)
  - [ ] DTOs: suffix `Dto` (`UserCreateDto`, `UserUpdateDto`)
  - [ ] Constants: UPPERCASE (`IAM_CACHE_KEYS`, `SYSTEM_ROLES`)

- [ ] **Barrel Import Policy**
  - [ ] Root `index.ts` TIDAK melakukan `export * from './dto'`
  - [ ] Root `index.ts` TIDAK melakukan `export *` dari service/route
  - [ ] External import DTOs via `@/modules/xxx/dto/entity.dto` (direct, bukan barrel)
  - [ ] Tidak ada `import * from '@/modules/xxx'` — hanya import Module class

---

## ✅ Phase 2: Service Layer

- [ ] **Method Naming Convention**
  - [ ] `get*()` — cache-backed reads, boleh dipanggil service lain
  - [ ] `handle*()` — router-facing, dipanggil **router saja**
  - [ ] Router TIDAK memanggil `get*()` langsung (harus lewat `handle*()`)
  - [ ] Service lain boleh memanggil `get*()` tapi TIDAK `handle*()`

- [ ] **Encapsulation**
  - [ ] `repo` selalu **`private readonly`** — tidak pernah diekspos
  - [ ] `clearCache()` selalu `private` — cache invalidation tidak bisa di-skip
  - [ ] Helper enrichment selalu `private`

- [ ] **Cache Management**
  - [ ] `bento.namespace('entity')` — isolated per entity
  - [ ] Gunakan `CACHE_KEY_DEFAULT` dari `@/core/cache` — tidak hardcoded
  - [ ] `clearCache()` dipanggil di semua write handler
  - [ ] `cache.deleteMany()` untuk batch invalidation (list + count + byId)
  - [ ] `cache.getOrSet({ factory: async ({ skip }) => ... ?? skip() })

- [ ] **No Usecase Layer**
  - [ ] ✅ **CONFIRMED** — Tidak ada folder `usecase/`
  - [ ] Orkestrasi lintas entity di service menggunakan lazy getter `() => dep`

- [ ] **Dependency Injection**
  - [ ] Cross-module dep diinject via lazy getter `() => dep` (bukan direct reference)
  - [ ] Module class (`XxxModule`) sebagai DI container
  - [ ] `getExternalModules()` factory untuk resolve cross-module dep

---

## ✅ Phase 3: Repository Layer

- [ ] **Structure**
  - [ ] Section: QUERY, MUTATION, PRIVATE (dengan comment separator)
  - [ ] Tidak ada business logic di repo (no validation, no caching)
  - [ ] Setiap method di-wrap dengan `record('ClassName.methodName', ...)`

- [ ] **Query Patterns**
  - [ ] Batch fetch menggunakan `inArray()` bukan loop+await
  - [ ] Paginated query menggunakan `paginate()` dari `@/core/database`
  - [ ] Search menggunakan `searchFilter()` dari `@/core/database`
  - [ ] `buildWhereClause()` di-extract ke private method

- [ ] **Mutation Patterns**
  - [ ] Menggunakan `stampCreate(actorId)` / `stampUpdate(actorId)` untuk audit columns
  - [ ] `.returning({ id: table.id })` untuk mendapatkan inserted/updated ID
  - [ ] Multi-step mutation menggunakan `db.transaction(async (tx) => { ... })`

---

## ✅ Phase 4: Router Layer

- [ ] **Handler Pattern (Co-located)**
  - [ ] `initXxxRoute(service: XxxService)` — function, bukan class
  - [ ] File co-located: `entity.route.ts` di folder module (bukan `/router/` subfolder)
  - [ ] Named inner function: `async function create({ body, auth }) { ... }`
  - [ ] Router HANYA memanggil `service.handle*()` — tidak `get*()` langsung

- [ ] **Endpoint Convention**
  - [ ] `GET /list` → `handleList(filter)`
  - [ ] `GET /detail` + query id → `handleDetail(id)`
  - [ ] `POST /create` → `handleCreate(data, actorId)`
  - [ ] `PUT /update` → `handleUpdate(id, data, actorId)`
  - [ ] `DELETE /remove` → `handleRemove(id)`

- [ ] **Response Format**
  - [ ] List: `res.paginated(result)` dengan `createPaginatedResponseSchema`
  - [ ] Single: `res.ok(result)` dengan `createSuccessResponseSchema`
  - [ ] Auth: `auth: true` untuk protected endpoints

- [ ] **Auth**
  - [ ] Protected endpoints punya `auth: true`
  - [ ] `auth.userId` digunakan sebagai `actorId`

---

## ✅ Phase 5: Type Safety

- [ ] **TypeScript**
  - [ ] Tidak ada `any`
  - [ ] Semua parameter dan return type dideklarasikan
  - [ ] Tidak ada `!` non-null assertion tanpa alasan yang jelas

- [ ] **Zod DTOs**
  - [ ] Menggunakan spread-shape: `z.object({ ...Base.shape, ...Extra.shape })`
  - [ ] Tidak menggunakan `.extend()` (menyebabkan hilangnya type inference)
  - [ ] Response schema terdaftar di route options (`response: createSuccessResponseSchema(...)`)

- [ ] **Error Handling**
  - [ ] Service TIDAK mengembalikan `null/undefined` untuk kondisi error — throw instead
  - [ ] Menggunakan error factory dari `errors.ts`
  - [ ] Route handler tidak melakukan try/catch (biarkan framework handle)

---

## ✅ Phase 6: Validation & Conflict Checking

- [ ] **Input Validation**
  - [ ] Semua route punya `body` atau `query` yang di-typed dengan DTO

- [ ] **Uniqueness Checking**
  - [ ] CREATE: `checkConflict({ ..., input: data })` tanpa `existing`
  - [ ] UPDATE: `checkConflict({ ..., input: data, existing })` dengan `existing`
  - [ ] `conflictFields` didefinisikan di luar class (module-level constant)

- [ ] **Audit Trails**
  - [ ] Semua write menyertakan `actorId` (`createdBy`/`updatedBy`)

---

## ✅ Phase 7: Performance

- [ ] Tidak ada N+1 query (gunakan `inArray()` + `RelationMap`)
- [ ] Parallel independent queries menggunakan `Promise.all([])`
- [ ] Data yang sering dibaca di-cache (`bento.getOrSet()`)
- [ ] List endpoint punya pagination (tidak return semua data)

---

## ✅ Phase 8: Testing

- [ ] **Test Structure**
  - [ ] `entity.service.test.ts` — co-located dengan service
  - [ ] `entity.route.test.ts` — co-located dengan route
  - [ ] Skip DTO tests — validation tested via routes

- [ ] **Service Tests**
  - [ ] Fake repo injection via constructor: `new EntityService(fakeRepo)`
  - [ ] Test `get*()` methods dengan mocked repo
  - [ ] Test `handle*()` error cases (throw dengan error.code check)
  - [ ] Test cross-module interactions dengan mock

- [ ] **Route Tests**
  - [ ] Mock auth dengan `createMockAuthPlugin()`
  - [ ] Mock service dengan partial implementation
  - [ ] Test response format (success, paginated, validation errors)
  - [ ] Test auth rejection (401)

---

## ✅ Phase 9: Quality Checks

- [ ] `bun run typecheck` zero errors untuk module ini
- [ ] `bun test` passing untuk semua test files
- [ ] Tidak ada unused imports / variables (knip clean)
- [ ] Tidak ada hardcoded cache keys — gunakan `CACHE_KEY_DEFAULT`

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

## ❌ Anti-patterns to Avoid

### 1. Router memanggil `get*()` langsung

```typescript
// ❌ SALAH
async function detail({ query }) {
  const user = await service.getById(query.id) // bukan handle*()!
}

// ✅ BENAR
async function detail({ query }) {
  const result = await service.handleDetail(query.id)
}
```

### 2. `repo` diekspos keluar service

```typescript
// ❌ SALAH — repo jadi public sehingga bisa di-bypass
export class UserService {
  constructor(public repo = new UserRepo()) {} // ← public
}
// lalu dari luar: service.repo.create(...)

// ✅ BENAR
export class UserService {
  constructor(private repo = new UserRepo()) {} // ← private
}
```

### 3. `clearCache()` dipanggil dari luar

```typescript
// ❌ SALAH — clearCache bisa di-skip (forgotten)
export class UserService {
  public async clearCache() { ... } // ← public
}
// dari luar: await service.clearCache()

// ✅ BENAR
export class UserService {
  private async clearCache() { ... } // ← private, selalu dipanggil oleh handle*()
}
```

### 4. Root `index.ts` mengekspos semua symbol

```typescript
// ❌ SALAH — membebani autocompletion editor
export * from './dto'
export * from './service'
export * from './router'

// ✅ BENAR — hanya public API
export class IamModule { ... }
export interface IamServices { ... }
```

### 5. Usecase layer untuk orkestrasi sederhana

```typescript
// ❌ SALAH — menambah layer tanpa alasan
// usecase/role.usecase.ts
export class RoleUsecases {
  constructor(private roleService: RoleService) {} // hanya 1 dep dari module sendiri!
  async handleCreate(data, actorId) {
    return this.roleService.handleCreate(data, actorId) // cuma proxy
  }
}

// ✅ BENAR — router langsung ke service
initRoleRoute(m.service.role)
```

### 6. Cache invalidation terlewat

```typescript
// ❌ SALAH — cache tidak di-invalidate
async handleCreate(data, actorId) {
  const id = await this.repo.create(data, actorId)
  return { id }  // ← clearCache() tidak dipanggil!
}

// ✅ BENAR
async handleCreate(data, actorId) {
  const id = await this.repo.create(data, actorId)
  await this.clearCache()  // ← selalu dipanggil setelah write
  return { id }
}
```

---

## 📝 Review Template

```markdown
# Module Review: [ModuleName]

## Overall Assessment
⭐⭐⭐⭐⭐ (1–5 stars)

## Strengths
- ...

## Issues Found
- ...

## Score
- Structure: __ / 10
- Service Layer: __ / 15
- Repository: __ / 11
- Router: __ / 12
- Type Safety: __ / 8
- Validation: __ / 7
- Performance: __ / 4
- Quality: __ / 3
- **Total: __ / 70**

## Verdict
🟢 Ready to ship / 🟡 Minor fixes needed / 🔴 Major revisions required
```
