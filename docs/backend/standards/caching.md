# Backend Standard: Caching (BentoCache)

This document defines the patterns for caching in Ikki ERP using [BentoCache](https://bentocache.dev/).

## 1. Principles

1. **Namespace Isolation**: Every domain service MUST use its own namespace.
2. **Atomicity**: Use `getOrSet` for all lazy-loading read operations.
3. **Consistency**: Invalidate cache immediately after write operations (`create`, `update`, `remove`).
4. **No Side Effects**: Cache factories should be pure transformations of data from the database.

## 2. Global Strategy

- **Primary Store**: L1 Memory (LRU) - 10MB limit.
- **TTL**: Default 1 day (unless specified).
- **Grace Period**: Disabled by default.

## 3. Implementation Pattern

### Namespace Definition
Define the namespace at the top of the service file or class.

```typescript
import { bento } from '@/core/cache'

const cache = bento.namespace('catalog.product')
```

### Standard Keys
- `list`: Full collection listing.
- `count`: Total count listing.
- `${id}`: Specific record ID.
- `seed`: Migration identifiers.

### Read Operation (Lazy Loading)
```typescript
async find(): Promise<ProductDto[]> {
  return cache.getOrSet({
    key: 'list',
    factory: async () => {
      return db.select().from(productsTable)
    }
  })
}
```

### Write Operation (Invalidation)
Always implement a private `clearCache` helper and call it in `handleCreate`, `handleUpdate`, and `handleRemove`.

```typescript
private async clearCache(id?: number) {
  const keys = ['count', 'list']
  if (id) keys.push(`${id}`)
  await cache.deleteMany({ keys })
}
```

## 4. Why BentoCache?

- **Multilevel Caching**: Easy addition of L2 (Redis) in the future.
- **Type Safety**: Native Typescript support.
- **Namespace Support**: Simplifies invalidation of related data.
- **Resilience**: Built-in protection against cache stampedes.
