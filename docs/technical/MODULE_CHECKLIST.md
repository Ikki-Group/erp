# 📋 Module Review Checklist

Gunakan checklist ini untuk review modules `src/modules/*` sesuai standar **Golden Path 2.1**.

---

## ✅ Phase 1: Structure & Organization

- [ ] **Directory Structure**
  - [ ] `/dto/` — Zod schemas
  - [ ] `/repo/` — Drizzle queries
  - [ ] `/service/` — Business logic
  - [ ] `/router/` — HTTP handlers
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
  - [ ] Root `index.ts` TIDAK melakukan `export * from './service'`
  - [ ] Root `index.ts` TIDAK melakukan `export * from './router'`
  - [ ] External consumers mengimport DTOs via `@/modules/xxx/dto` (bukan via root)
  - [ ] Tidak ada consumer yang melakukan `import * from '@/modules/xxx'`

---

## ✅ Phase 2: Service Layer

- [ ] **Method Naming Convention**
  - [ ] `get*()` — cache-backed reads, boleh dipanggil service lain
  - [ ] `handle*()` — router-facing, dipanggil **router saja**
  - [ ] Router TIDAK memanggil `get*()` langsung (harus lewat `handle*()`)
  - [ ] Service lain boleh memanggil `get*()` tapi TIDAK `handle*()`

- [ ] **Encapsulation**
  - [ ] `repo` selalu `private` — tidak pernah diekspos ke luar service
  - [ ] `clearCache()` selalu `private` — cache invalidation tidak bisa di-skip dari luar
  - [ ] Helper enrichment (e.g. `buildUserDetail()`) selalu `private`

- [ ] **Cache Management**
  - [ ] `bento.namespace('entity')` — isolated per entity
  - [ ] Cache keys dari constants (`ENTITY_CACHE_KEYS`), tidak hardcoded string
  - [ ] `clearCache()` dipanggil di semua write handler: `handleCreate`, `handleUpdate`, `handleRemove`
  - [ ] `cache.deleteMany()` untuk batch invalidation (LIST + COUNT + DETAIL)
  - [ ] `cache.getOrSet({ factory: async ({ skip }) => ... ?? skip() })` — tidak cache `undefined`

- [ ] **No Usecase Layer**
  - [ ] Tidak ada folder `usecase/` di dalam modul
  - [ ] Orkestrasi lintas entity diselesaikan di dalam service menggunakan lazy getter

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

- [ ] **Handler Pattern**
  - [ ] Router function menggunakan `initXxxRoute(service: XxxService)` — function, bukan class
  - [ ] Setiap endpoint menggunakan named inner function: `async function create({ body, auth }) { ... }`
  - [ ] Router HANYA memanggil `service.handle*()` — tidak memanggil `get*()` langsung

- [ ] **Endpoint Convention**
  - [ ] `GET /list` → `handleList(filter)`
  - [ ] `GET /detail` + query id → `handleDetail(id)`
  - [ ] `POST /create` → `handleCreate(data, actorId)`
  - [ ] `PUT /update` → `handleUpdate(id, data, actorId)`
  - [ ] `DELETE /remove` → `handleRemove(id)`

- [ ] **Response Format**
  - [ ] List: `res.paginated(result)`
  - [ ] Single: `res.ok(result)`
  - [ ] Schema response: `createPaginatedResponseSchema(dto.EntityDto)` / `createSuccessResponseSchema(...)`

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

## ✅ Phase 8: Quality Checks

- [ ] `npx tsc --noEmit` zero errors untuk module ini
- [ ] Tidak ada unused imports / unused variables
- [ ] Tidak ada hardcoded string untuk cache keys, IDs, atau kode error

---

## 📊 Scoring

```
Phase 1 (Structure):         __ / 10
Phase 2 (Service Layer):     __ / 15
Phase 3 (Repository):        __ / 11
Phase 4 (Router):            __ / 12
Phase 5 (Type Safety):       __ / 8
Phase 6 (Validation):        __ / 7
Phase 7 (Performance):       __ / 4
Phase 8 (Quality):           __ / 3

TOTAL:                       __ / 70
```

### Score Interpretation

| Score | Verdict |
|-------|---------|
| 70/70 | 🟢 Production-ready, gold standard |
| 60–69 | 🟢 Ship with confidence |
| 50–59 | 🟡 Minor improvements before merge |
| 40–49 | 🟡 Needs work, address before shipping |
| < 40  | 🔴 Major revisions required |

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
