# Validation Module Structure

## Overview
The validation module provides a well-organized, scalable collection of Zod validators organized by category for excellent DX (Developer Experience).

## File Organization

### 📦 `primitive.ts` - Basic Type Validators
Core primitive validators for building blocks.

**Exports:**
- **String**: `zStr`, `zStrNullable`
- **Numeric**: `zNum`, `zNumCoerce`, `zId`
- **Temporal**: `zDate`
- **Boolean**: `zBool`
- **Authentication**: `zEmail`, `zPassword`, `zUsername`
- **Special**: `zUuid`, `zCodeUpper`, `zDecimal`
- **Namespace**: `zp` (for bulk access)

```ts
import { zStr, zId, zEmail, zp } from '@/core/validation'
// or
import { zp } from '@/core/validation'
const name = zp.str
```

---

### 🔍 `query.ts` - Query Parameter Validators
Common patterns for validating HTTP query parameters.

**Exports:**
- **IDs**: `zQueryId`, `zQueryIds`
- **Strings**: `zQuerySearch`
- **Booleans**: `zQueryBoolean`
- **Pagination**: `zQueryPagination`
- **Namespace**: `zq` (for bulk access)

```ts
import { zQuerySearch, zQueryPagination, zq } from '@/core/validation'

// Parse query params
const query = zq.pagination.parse(req.query)
// { page: 1, limit: 10 }

// Or use individually
const search = zQuerySearch.parse(req.query.q)
```

---

### 🏗️ `common.ts` - Reusable DTO Schemas
Common, composable schemas for DTOs and data models.

**Exports:**
- **Record**: `zRecordId`, `zRecordIdDto`
- **Timestamps**: `zTimestamps`
- **Audit**: `zActors`, `zAuditMeta`, `zAuditResolvedDto`
- **Soft Delete**: `zSoftDelete`
- **Sync**: `zSyncMeta`
- **User**: `zUserSnippetDto`
- **Pagination**: `zPaginationMeta`, `zPaginationDto`
- **Metadata**: `zMetadataDto`
- **Namespace**: `zs` (for bulk access)

```ts
import { zRecordIdDto, zMetadataDto, zs } from '@/core/validation'

// Use in your DTOs
const UserDto = z.object({
	...zRecordIdDto.shape,
	name: zStr,
	...zMetadataDto.shape,
})

// Or via namespace
const UserDto = z.object({
	...zs.RecordId.shape,
	name: zStr,
	...zs.Metadata.shape,
})
```

---

### 📤 `response.ts` - Response Schema Factories
Factories for creating standardized response schemas.

**Exports:**
- `createSuccessResponseSchema(dataSchema)` - Single item response
- `createListResponseSchema(itemSchema)` - List response (alias: `createPaginatedResponseSchema`)
- `createErrorResponseSchema(detailsSchema?)` - Error response
- **Namespace**: `rs` (for bulk access)

```ts
import { createSuccessResponseSchema, createListResponseSchema, rs } from '@/core/validation'

const UserSchema = z.object({ id: zId, name: zStr })

// Single item response
const UserResponse = createSuccessResponseSchema(UserSchema)
// { success: true, code: 'OK', data: { id, name } }

// List response
const UsersResponse = createListResponseSchema(UserSchema)
// { success: true, code: 'OK', data: [...], meta: { page, limit, total, totalPages } }

// Via namespace
const response = rs.createSuccess(UserSchema)
```

---

## Usage Examples

### Example 1: DTO with Metadata
```ts
import { zId, zStr, zRecordIdDto, zMetadataDto } from '@/core/validation'

const MaterialDto = z.object({
	...zRecordIdDto.shape,
	code: zStr,
	name: zStr,
	...zMetadataDto.shape,
})

type Material = z.infer<typeof MaterialDto>
```

### Example 2: Query Pagination
```ts
import { zQueryPagination, zQuerySearch } from '@/core/validation'

const query = zQueryPagination.parse({
	page: req.query.page,
	limit: req.query.limit,
})

const searchTerm = zQuerySearch.parse(req.query.q)
```

### Example 3: Response Wrappers
```ts
import { createSuccessResponseSchema, createListResponseSchema } from '@/core/validation'

const itemSchema = z.object({ id: zId, name: zStr })

// Single item
const getOneResponse = createSuccessResponseSchema(itemSchema)
const data = { success: true, code: 'OK', data: { id: 1, name: 'Test' } }

// List with pagination
const getListResponse = createListResponseSchema(itemSchema)
const data = {
	success: true,
	code: 'OK',
	data: [{ id: 1, name: 'Test' }],
	meta: { page: 1, limit: 10, total: 100, totalPages: 10 }
}
```

### Example 4: Using Namespaces
```ts
import { zp, zq, zs, rs } from '@/core/validation'

// Primitives
const email = zp.email.parse('user@example.com')
const id = zp.id.parse('123')

// Query
const pagination = zq.pagination.parse(req.query)
const ids = zq.ids.parse(req.query.ids) // accepts '1' or '1,2,3'

// Common
const record = zs.RecordId.parse({ id: 1 })
const metadata = zs.Metadata.parse(auditData)

// Response
const response = rs.createSuccess(UserSchema)
```

---

## Design Principles

### 1. **Clear Categorization**
Each file has a specific responsibility:
- `primitive.ts` → Basic types
- `query.ts` → HTTP query parameters
- `common.ts` → Reusable DTOs
- `response.ts` → Response factories

### 2. **Dual Export Patterns**
Every validator is available in two ways:
- **Individual exports** for tree-shaking: `import { zStr, zId } from '@/core/validation'`
- **Namespace exports** for bulk access: `import { zp, zq, zs, rs } from '@/core/validation'`

```ts
// Both work equally
import { zStr, zId } from '@/core/validation'
import { zp } from '@/core/validation'
const str = zStr  // or zp.str
```

### 3. **Type Safety**
All validators include proper types that infer correctly:
```ts
type AuditMeta = z.infer<typeof zAuditMeta>
type PaginationMeta = z.infer<typeof zPaginationMeta>
```

### 4. **Composability**
Validators are designed to be composed together:
```ts
const UserDto = z.object({
	...zRecordIdDto.shape,
	...zMetadataDto.shape,
	name: zStr,
})
```

### 5. **Consistency**
- All primitives are organized by type category
- All query validators follow the `zQuery*` naming convention
- All common schemas use consistent naming in the `zs` namespace
- All response factories are available via the `rs` namespace

---

## Migration from Old Structure

Old code using single imports:
```ts
// ❌ Old
import { zStr, createSuccessResponseSchema } from '@/core/validation'
```

Still works! The exports are compatible. You can also opt into new patterns:
```ts
// ✅ New - More discoverable
import { zStr, zp } from '@/core/validation'
import { createSuccessResponseSchema, rs } from '@/core/validation'
```

---

## Best Practices

1. **Use individual imports for clarity**
   ```ts
   import { zStr, zId, zEmail } from '@/core/validation'
   ```

2. **Use namespace imports for bulk operations**
   ```ts
   import { zp } from '@/core/validation'
   // Access: zp.str, zp.id, zp.email, ...
   ```

3. **Compose DTOs with shape spreading**
   ```ts
   const MyDto = z.object({
   	...zRecordIdDto.shape,
   	...zMetadataDto.shape,
   	field: zStr,
   })
   ```

4. **Use query validators for HTTP parameters**
   ```ts
   const query = zQueryPagination.parse(req.query)
   ```

5. **Use response factories for consistent API responses**
   ```ts
   const response = createSuccessResponseSchema(MyDto)
   ```
