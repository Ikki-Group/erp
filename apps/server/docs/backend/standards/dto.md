# Backend Standard: Data Transfer Objects (DTO)

This document defines the standards for Data Transfer Objects (DTO) using **Zod** and **TypeScript** within the Ikki ERP backend.

## 1. Naming Convention (The `Dto` Suffix)

To clearly distinguish data structures (Zod schemas and inferred types) from behavioral entities (Service and Router classes), all DTO-related exports must append the `Dto` suffix.

```typescript
export const LocationDto = z.object({ ... })
export type LocationDto = z.infer<typeof LocationDto>
```

## 2. Schema Composition (The Spread Pattern)

To maintain clean and DRY code, avoid using Zod's `.extend()` where possible. Instead, use the **Spread Pattern** (`...BaseDto.shape`) to compose schemas.

```typescript
/** Common attributes */
export const UserBaseDto = z.object({ 
  email: zEmail, 
  username: zUsername 
})

/** Full record includes ID and Metadata */
export const UserDto = z.object({
  ...zId.shape,           // include 'id'
  ...UserBaseDto.shape,   // include email, username
  ...zMetadataDto.shape   // include createdAt, updatedAt, etc.
})
```

## 3. Standard DTO Life Cycle

Each domain module should define the following standard DTOs:

| DTO Name | Description | Pattern |
| :--- | :--- | :--- |
| `BaseDto` | Core business attributes (no ID, no metadata). | `z.object({ ... })` |
| `[Domain]Dto` | The full database representation (ID + Base + Metadata). | `z.object({ ...zId.shape, ...BaseDto.shape, ...zMetadataDto.shape })` |
| `CreateDto` | Data required for insertion (usually `BaseDto` + extras). | `BaseDto` or `BaseDto.extend({ ... })` |
| `UpdateDto` | Data required for a **Full Update** (ID + BaseDto). | `z.object({ ...zId.shape, ...BaseDto.shape })` |
| `FilterDto` | Query parameters for listing (Pagination + Search). | `z.object({ ...zPaginationDto.shape, ... })` |

## 4. Integer IDs & Primitives

All primary and foreign keys must use strictly typed **Serial Integers** via standard core primitives.

- **Primary Key**: Use `zId` from `@/core/validation/primitive`.
- **Foreign Keys**: Use `zId` for field validation.

```typescript
export const MyRecordDto = z.object({
  id: zId,         // Primary Key
  userId: zId,     // Foreign Key
})
```

## 5. Enum Documentation

Enums defined in the Dto layer should also carry the `Dto` suffix for consistency.

```typescript
export const LocationTypeDto = z.enum(['store', 'warehouse'])
export type LocationTypeDto = z.infer<typeof LocationTypeDto>
```

## 6. Strict Type Safety (No `any`)

- **Zero `any`**: All DTOs must be perfectly typed.
- **Strict Parsing**: Use `Dto.parse(data)` in services to ensure the output matches the contract exactly.

---

> [!NOTE]
> Detailed examples of these standards can be found in the **Location** and **IAM** modules within `src/modules/`.
