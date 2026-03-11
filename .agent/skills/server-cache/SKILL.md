---
name: server-cache
description: Add caching to a server service following Ikki ERP write-through invalidation patterns
---

# Server Cache Skill

Add caching to an existing or new service following the Ikki ERP caching conventions: cache-aside reads with immediate write-through invalidation.

## When to Use

Use this skill when:

- Adding caching to a new service created by the `server-crud-module` skill
- Reviewing or fixing caching in an existing service
- Need to verify caching patterns are correct for a service

## When NOT to Use

Do NOT add caching to:

- `handleList` methods — dynamic filters create key explosion, invalidation is impractical
- High-frequency write services (e.g., `MaterialLocationService`, `StockTransactionService`)
- Append-only journal tables (stock transactions, audit logs)

---

## Step 1: Define Cache Keys

Add a `cacheKey` constant **at module level** (outside the class), after error constants and uniqueness fields:

```typescript
const cacheKey = {
  count: '<entity>.count',
  list: '<entity>.list',
  byId: (id: number) => `<entity>.byId.${id}`,
}
```

### Key Naming Rules

| Rule | Example |
|------|---------|
| Namespace = singular entity name | `role`, `user`, `material`, `session` |
| No module prefix | ✅ `role.count` ❌ `iam.role.count` |
| Three standard keys | `count`, `list`, `byId` |
| Omit unused keys | Skip `list` if no `find()` method, skip `count` if no `count()` method |

---

## Step 2: Wrap Read Methods

Wrap these read methods with `cache.wrap()`:

```typescript
import { cache } from '@/core/cache'
```

### `find()` — All rows, no filter

```typescript
async find(): Promise<EntityDto[]> {
  return record('EntityService.find', async () => {
    return cache.wrap(cacheKey.list, async () => {
      return db.select().from(entityTable).orderBy(entityTable.name)
    })
  })
}
```

### `findById(id)` — Single row by PK

```typescript
async findById(id: number): Promise<EntityDto> {
  return record('EntityService.findById', async () => {
    return cache.wrap(cacheKey.byId(id), async () => {
      const result = await db.select().from(entityTable).where(eq(entityTable.id, id))
      return takeFirstOrThrow(result, `Entity ${id} not found`, 'ENTITY_NOT_FOUND')
    })
  })
}
```

### `count()` — Total row count

```typescript
async count(): Promise<number> {
  return record('EntityService.count', async () => {
    return cache.wrap(cacheKey.count, async () => {
      const result = await db.select({ val: count() }).from(entityTable)
      return result[0]?.val ?? 0
    })
  })
}
```

### What NOT to cache

| Method | Cache? | Reason |
|--------|--------|--------|
| `find()` | ✅ | Static unbounded query |
| `findById(id)` | ✅ | Most frequently called |
| `count()` | ✅ | Often paired with list |
| `handleList(filter, pq)` | ❌ | Dynamic filters = key explosion |
| `handleDetail(id)` | ✅ indirect | Delegates to `findById` which is cached |
| `handleCreate/Update/Remove` | ❌ | Write operations — trigger invalidation |

---

## Step 3: Implement `clearCache()`

Add a private method at the **bottom** of the service class:

```typescript
/**
 * Clears relevant entity caches.
 */
private async clearCache(id?: number) {
  await Promise.all([
    cache.del(cacheKey.count),
    cache.del(cacheKey.list),
    id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
  ])
}
```

### Calling Convention

| Mutation | Call | Why |
|----------|------|-----|
| `handleCreate` | `void this.clearCache()` | No ID yet for byId, clears count + list |
| `handleUpdate` | `void this.clearCache(id)` | Clears all three keys |
| `handleRemove` | `void this.clearCache(id)` | Clears all three keys |
| `seed` | `void this.clearCache()` | Bulk insert, clear count + list |

### Fire-and-Forget Rule

Always use `void this.clearCache(...)` — invalidation runs in the background. The mutation response should NOT await cache deletion.

```typescript
async handleCreate(data: CreateDto, actorId: number): Promise<{ id: number }> {
  return record('EntityService.handleCreate', async () => {
    // ... insert logic ...

    void this.clearCache()  // ← fire-and-forget
    return inserted
  })
}

async handleUpdate(id: number, data: UpdateDto, actorId: number): Promise<{ id: number }> {
  return record('EntityService.handleUpdate', async () => {
    // ... update logic ...

    void this.clearCache(id)  // ← includes byId invalidation
    return { id }
  })
}

async handleRemove(id: number): Promise<{ id: number }> {
  return record('EntityService.handleRemove', async () => {
    // ... delete logic ...

    void this.clearCache(id)  // ← includes byId invalidation
    return { id }
  })
}
```

---

## Step 4: Required Import

Ensure the service file imports the cache module:

```typescript
import { cache } from '@/core/cache'
```

This import goes with other `@/core/*` imports in the import section.

---

## Cross-Module Invalidation

### Rule: Each module only invalidates its OWN cache

**NEVER** call another module's `clearCache()` or directly `cache.del()` another module's keys.

```typescript
// ✅ CORRECT — each module manages its own cache
await materialCategorySvc.handleUpdate(id, data, actorId)
// MaterialCategoryService internally calls its own clearCache()
// MaterialService.handleList will get fresh categories via categorySvc.find() next time

// ❌ WRONG — cross-module cache invalidation
await materialCategorySvc.handleUpdate(id, data, actorId)
await cache.del('material.list')  // violates module boundary
```

### Why This Works

`handleList` and `handleDetail` resolve relations by calling the parent service's cached `find()`/`findById()`. When the parent is updated, its own `clearCache()` ensures the next call returns fresh data. The downstream service doesn't need to know.

---

## Complete Service File Structure

```typescript
import { record } from '@elysiajs/opentelemetry'
import { count, eq } from 'drizzle-orm'

import { cache } from '@/core/cache'
import {
  checkConflict, paginate, searchFilter, sortBy,
  stampCreate, stampUpdate, takeFirstOrThrow,
  type ConflictField,
} from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { entityTable } from '@/db/schema'

import { db } from '@/db'

import type { EntityCreateDto, EntityDto, EntityFilterDto, EntityUpdateDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`Entity ${id} not found`, 'ENTITY_NOT_FOUND'),
}

const uniqueFields: ConflictField<'code' | 'name'>[] = [...]

const cacheKey = {
  count: 'entity.count',
  list: 'entity.list',
  byId: (id: number) => `entity.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class EntityService {
  // ... find(), findById(), count() with cache.wrap()
  // ... handleList() WITHOUT cache
  // ... handleCreate/Update/Remove() with void this.clearCache()

  private async clearCache(id?: number) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }
}
```

---

## Validation Checklist

After adding caching, verify:

- [ ] `cacheKey` uses correct entity namespace (singular, no module prefix)
- [ ] `find()`, `findById()`, `count()` wrapped with `cache.wrap()`
- [ ] `handleList` is NOT cached
- [ ] `clearCache()` deletes all three key types (count, list, byId)
- [ ] All mutations call `void this.clearCache()` or `void this.clearCache(id)`
- [ ] No cross-module cache invalidation
- [ ] `import { cache } from '@/core/cache'` is present
- [ ] Fire-and-forget (`void`) used on all `clearCache` calls
