# Backend Standard: Service Layer (Layer 0)

This document defines the architectural standards for the Service layer within the Ikki ERP backend.

## 1. Responsibilities

The Service layer is responsible for:

- Orchestrating database operations (Drizzle).
- Managing business logic and validation beyond simple schema checks.
- Handling cache invalidation and wrapping (`cache-manager`).
- Tracing and performance recording (`opentelemetry`).
- Throwing domain-specific errors for the Router layer to catch.

## 2. Standard Method Naming

Each domain service should implement the following standard methods to ensure a consistent API across modules:

| Method Name        | Description                              | Pattern                            |
| :----------------- | :--------------------------------------- | :--------------------------------- |
| `handleList`       | Paginated listing with filters.          | `Promise<WithPaginationResult<T>>` |
| `handleDetail`     | Fetch a single resource by ID.           | `Promise<T>`                       |
| `handleCreate`     | Business logic for creating a resource.  | `Promise<{ id: number }>`          |
| `handleUpdate`     | Business logic for full resource update. | `Promise<{ id: number }>`          |
| `handleRemove`     | Soft delete/Archive a resource.          | `Promise<{ id: number }>`          |
| `handleHardRemove` | Permanent deletion (Admin only).         | `Promise<{ id: number }>`          |

## 3. Performance & Caching

### Opentelemetry Recording

Every service method must be wrapped in `record()` to enable distributed tracing.

```typescript
import { record } from '@elysiajs/opentelemetry'

async handleDetail(id: number) {
  return record('MyService.handleDetail', async () => {
    // ... logic
  })
}
```

### Cache Wrapping

Use `cache.wrap` for expensive read operations (e.g., `getById`, `count`, `list`).

```typescript
const cacheKey = {
  byId: (id: number) => `domain.byId.${id}`,
}

async getById(id: number) {
  return cache.wrap(cacheKey.byId(id), async () => {
    const rows = await db.select().from(table).where(eq(table.id, id))
    return takeFirstOrThrow(rows)
  })
}
```

## 4. Conflict Checking

Before creating or updating records with unique constraints (e.g., `code`, `name`), always use `core.checkConflict`.

```typescript
// ✅ CORRECT: Prevent database-level constraint violations early
await core.checkConflict({
	table: locationsTable,
	pkColumn: locationsTable.id,
	fields: uniqueFields,
	input: data,
	existing, // pass only during update
})
```

## 5. Standard Helpers

- **`takeFirstOrThrow`**: Extracts the first row from a Drizzle query or throws a `NotFound` error.
- **`paginate`**: Standardizes the `limit/offset` logic and count query.
- **`stampCreate / stampUpdate`**: Generates the audit columns (`createdBy`, `updatedAt`, etc.) consistent with the metadata standard.

## 6. Error Handling

Services should throw specific errors from `@/core/http/errors` instead of generic `Error` objects wherever possible.

```typescript
import { ConflictError, NotFoundError } from '@/core/http/errors'

if (!result) throw new NotFoundError('Resource not found', 'DOMAIN_NOT_FOUND')
```

---

> [!TIP]
> Always use `dto.[Domain].parse(row)` before returning data from the service. This ensures the output is strictly typed and any sensitive database fields are stripped out.
