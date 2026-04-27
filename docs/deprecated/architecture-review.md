# 🔍 Honest Architecture Review: IAM Module

## Masalah yang Ditemukan

### ❌ Masalah 1: Encapsulation Rusak — `repo` dan `clearCache` di-public-kan

Ini adalah masalah terbesar. Agar `Usecase` bisa bekerja, kita **terpaksa** membuat `repo` dan `clearCache` jadi `public`:

```typescript
// service/user.service.ts
export class UserService {
    constructor(public repo: UserRepo = new UserRepo()) {} // ← public!
    public async clearCache(id?: number) { ... }           // ← public!
}
```

Lalu di `Usecase`, kita memanggil repo langsung:
```typescript
// usecase/user.usecase.ts
await this.userService.repo.create(...)      // ← bypass service sepenuhnya
await this.userService.repo.remove(...)      // ← bypass service sepenuhnya  
await this.userService.clearCache()          // ← usecase mengurus cache service lain
```

**Kenapa ini buruk:**
- Service seharusnya meng-*encapsulate* repo — kalau usecase langsung akses repo, untuk apa ada service?
- Cache invalidation menjadi tanggung jawab usecase, bukan service pemilik cache. Ini rentan bug: kalau developer lupa panggil `clearCache()`, data jadi stale.
- Kode menjadi fragile — siapapun bisa panggil `repo` langsung dan lupa invalidate cache.

---

### ❌ Masalah 2: Usecase Tidak Konsisten — Kadang pakai service, kadang bypass

Perhatikan pola akses yang tidak konsisten:

```typescript
// usecase/user.usecase.ts
// READ → lewat service (bagus, pakai cache)
const user = await this.userService.getById(id)

// WRITE → bypass service, langsung ke repo (tidak konsisten!)
await this.userService.repo.create(...)
await this.userService.repo.update(...)
await this.userService.repo.remove(...)
```

Developer baru (atau Anda sendiri 3 bulan kemudian) akan bingung: 
*"Kapan harus pakai `service.xxx()` vs `service.repo.xxx()`?"*

---

### ❌ Masalah 3: Usecase Berlebihan untuk Entity Sederhana

Lihat `RoleUsecases` — ia hanya bergantung pada `RoleService` sendiri. Tidak ada cross-module dependency sama sekali:

```typescript
export class RoleUsecases {
    constructor(private roleService: RoleService) {} // ← hanya 1 dependency, dari modul sendiri
}
```

Kalau usecase hanya proxy ke 1 service dari modul yang sama, **ia tidak memberikan value tambah** — hanya menambah layer tanpa alasan.

Hal yang sama untuk `AssignmentUsecases` — ia hanya bergantung pada `UserAssignmentService`.

---

### ❌ Masalah 4: ConflictFields Duplikasi

`userConflictFields` dan `roleConflictFields` tadinya ada di service, sekarang dipindah ke usecase. Ini adalah **domain knowledge** (aturan bisnis tentang field mana yang unik) yang seharusnya tidak ada di layer orchestration.

---

### ❌ Masalah 5: Potensi Circular Import

```typescript
// router/index.ts
import type { IamUsecases } from '../index' // ← import dari parent index
```

`../index` (root module) juga `export * from './router'`, jadi secara tidak langsung ini bisa menyebabkan circular dependency.

---

### ❌ Masalah 6: Service Kehilangan Identitasnya

Setelah refactoring, `UserService` hanya jadi wrapper tipis di atas repo + cache:
- `getList()` → `repo.getList()` + cache
- `getById()` → `repo.getById()` + cache
- `count()` → `repo.count()` + cache
- `seed()` → `repo.seed()` + clearCache
- `getByIdentifier()` → `repo.findByIdentifier()`

Service kehilangan semua business logic dan write operations. Ini membuat service hampir identik dengan repo — jadi **2 layer melakukan hal yang sama**.

---

## 💡 Solusi yang Direkomendasikan

### Prinsip Utama
> **Service = Domain API** — satu-satunya cara mengakses dan memanipulasi sebuah entity. Cache, conflict check, dan business rules hidup di sini.
> 
> **Usecase = Cross-Module Orchestration** — HANYA ada jika operasi melibatkan >1 domain service dari modul berbeda.

### Aturan Sederhana:

| Kondisi | Gunakan |
|---------|---------|
| Operasi hanya melibatkan 1 service dari modul sendiri | **Service** langsung (tidak perlu usecase) |
| Operasi menggabungkan data/logik dari ≥2 modul | **Usecase** (yang memanggil service methods, bukan repo langsung) |

### Struktur yang Direkomendasikan:

```
modules/iam/
├── dto/
├── repo/               # Data access saja
├── service/            # Domain logic + cache + CRUD lengkap
│   ├── user.service.ts      # ✅ Punya create/update/remove + business logic
│   ├── role.service.ts      # ✅ Punya create/update/remove + business logic
│   └── assignment.service.ts # ✅ Punya semua assignment operations
├── usecase/            # HANYA untuk cross-module orchestration
│   └── user.usecase.ts      # ✅ Hanya fungsi yang butuh LocationService
├── router/
│   ├── user.route.ts         # Terima UserUsecases (karena butuh cross-module)
│   ├── role.route.ts         # Terima RoleService langsung (tidak perlu usecase)
│   └── assignment.route.ts   # Terima AssignmentService langsung
├── constants.ts
├── errors.ts
└── index.ts
```

### Contoh Kode yang Benar:

#### `role.service.ts` — Service Lengkap (tidak perlu usecase)
```typescript
export class RoleService {
    constructor(private repo = new RoleRepo()) {}

    // READ — tetap sama
    async getById(id: number) { /* cache + repo */ }
    async getList() { /* cache + repo */ }
    
    // WRITE — business logic + repo + cache invalidation tetap di sini
    async handleCreate(data: RoleCreateDto, actorId: number) {
        await checkConflict(...)
        const result = await this.repo.create(data, actorId)
        await this.clearCache()
        return { id: result }
    }
    
    async handleUpdate(data: RoleUpdateDto, actorId: number) { ... }
    async handleRemove(id: number) { ... }
    
    // HANDLER (untuk route)
    async handleList(filter) { return this.repo.getListPaginated(filter) }
    async handleDetail(id) { ... }
    
    private async clearCache(id?: number) { ... } // ← kembali private!
}
```

#### `user.usecase.ts` — Hanya fungsi yang butuh cross-module
```typescript
export class UserUsecases {
    constructor(
        private userService: UserService,      // ← panggil via service methods
        private assignmentService: AssignmentService,
        private roleService: RoleService,
        private locationService: LocationMasterService,
    ) {}

    // ✅ Cross-module: butuh role + location + assignment
    async getUserDetail(id: number) {
        const user = await this.userService.getById(id)
        const assignments = await this.getUserAssignments(user)
        return { ...user, assignments }
    }

    // ✅ Cross-module: user create + assignment create
    async handleCreate(data: UserCreateDto, actorId: number) {
        const { id } = await this.userService.handleCreate(data, actorId) // ← lewat service!
        if (data.assignments?.length) {
            await this.assignmentService.handleReplaceBulkByUserId(id, ...)
        }
        return { id }
    }

    // ✅ Cross-module: user update + assignment update  
    async handleUpdate(id, data, actorId) { ... }
    
    // ✅ Cross-module: list + enrich dengan role/location
    async handleList(filter) { ... }
    async handleDetail(id) { ... }
}
```

### Perbedaan Kunci:
1. **`repo` dan `clearCache` kembali `private`** — encapsulation terjaga
2. **Service punya `handleCreate/Update/Remove`** — sehingga usecase tinggal *compose*, bukan *reimplementasi*
3. **Role dan Assignment tidak perlu usecase** — mereka tidak punya cross-module dependency
4. **ConflictFields tetap di service** — karena ini domain knowledge
5. **Router langsung ke service** untuk entity sederhana, ke usecase untuk yang kompleks

---

## Ringkasan Keputusan

| Entity | Router menerima | Alasan |
|--------|----------------|--------|
| **User** | `UserUsecases` | Butuh Location, Role, Assignment dari modul lain |
| **Role** | `RoleService` langsung | Mandiri, tidak butuh cross-module |
| **Assignment** | `UserAssignmentService` langsung | Mandiri, tidak butuh cross-module |

Pendekatan ini menghasilkan **kode yang lebih sedikit, lebih konsisten, dan lebih mudah dipahami** — ideal untuk solo developer.
