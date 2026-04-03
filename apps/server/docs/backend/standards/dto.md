# Backend Standard: Data Transfer Objects (DTO)

This document defines the **Golden Path 2.0** standards for Data Transfer Objects (DTO) using **Zod** and **TypeScript** within the Ikki ERP backend.

## 1. Naming Convention (Inferred Types)

Variable names must match the inferred TypeScript type name. This improves DX (Developer Experience) and ensures that all modules use consistent naming.

```typescript
// ✅ CORRECT: Name-Matched Type
export const User = z.object({ ... })
export type User = z.infer<typeof User>

// ❌ INCORRECT: Mismatched or non-exported types
const userSchema = z.object({ ... })
export type UserType = z.infer<typeof userSchema>
```

## 2. Schema Composition (The Spread Pattern)

To maintain clean and DRY (Don't Repeat Yourself) code, avoid using Zod's `.extend()` where possible. Instead, use the **Spread Pattern** (`...Base.shape`) to compose schemas.

```typescript
/** Common attributes */
export const UserBase = z.object({ 
  email: zEmail, 
  username: zUsername 
})

/** Full record includes ID and Metadata */
export const User = z.object({
  ...zId.shape,        // include 'id'
  ...UserBase.shape,   // include email, username
  ...zMetadataDto.shape // include createdAt, updatedAt, etc.
})
```

## 3. Standard DTO Life Cycle

Each domain module (e.g., `location`, `iam`) should define the following standard DTOs:

| DTO Name | Description | Pattern |
| :--- | :--- | :--- |
| `Base` | Core business attributes (no ID, no metadata). | `z.object({ ... })` |
| `Record / [Domain]` | The full database representation (ID + Base + Metadata). | `z.object({ ...zId.shape, ...Base.shape, ...zMetadataDto.shape })` |
| `Create` | Data required for insertion (usually `Base` or `Base + Password`). | `Base` or `Base.extend({ ... })` |
| `Update` | Data required for a **Full Update** (ID + Base). | `z.object({ ...zId.shape, ...Base.shape })` |
| `Filter` | Query parameters for listing (Pagination + Search). | `z.object({ ...zPaginationDto.shape, q: z.string().optional() })` |

## 4. Integer IDs & Primitives

Following the architectural reboot (MD-04), all primary and foreign keys must use strictly typed **Serial Integers** unless explicitly documented otherwise.

- **Primary Key**: Use `zId` from `@/core/validation/primitive`.
- **Foreign Keys**: Use `zId` for field validation in the DTO.

```typescript
import { zId, zStr, zEmail } from '@/core/validation'

export const MyDto = z.object({
  userId: zId,     // Consistent number ID
  name: zStr,      // Trimmed string
  email: zEmail,   // Lowercased and validated email
})
```

## 5. Enum Documentation

Enums should be defined as standalone Zod schemas with JSDoc comments for each member. This enables rich IDE tooltips and better documentation for API consumers.

```typescript
export const LocationType = z.enum([
  /** Retail storefront for customers. */
  'store',
  /** Storage facility for inventory. */
  'warehouse',
])
export type LocationType = z.infer<typeof LocationType>
```

## 6. Strict Type Safety (No `any`)

- **Zero `any`**: All DTOs must be perfectly typed. Use `z.infer` to ensure that logic layers (Services, Routers) have absolute type safety.
- **Narrowing**: Use `Schema.parse(data)` or `Schema.safeParse(data)` to narrow unknown data into strict DTO types.
- **No `@ts-ignore`**: Address type issues by refining schemas or improving generic constraints in the core layer instead of ignoring them.

---

> [!NOTE]
> The **Location** and **IAM** modules in `src/modules/` are the definitive reference implementations for these standards.
