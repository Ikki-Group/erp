---
name: server-dto
description: Generate DTO (Data Transfer Object) files with Zod v4 following Ikki ERP naming, structure, and validation conventions
---

# Server DTO Generator

This skill generates DTO files using Zod v4 that follow the Ikki ERP conventions for naming, structure, section ordering, and validation primitives.

## When to Use

Use this skill when:

- Creating a new DTO file for a new entity
- Adding DTO sections (Filter, Output, Create, Update) to an existing entity
- Reviewing or refactoring existing DTOs for convention compliance
- Unsure which `zPrimitive` / `zHttp` helper to use for a field

## Input Required

When asked to create a DTO, gather this information:

- **Entity name**: PascalCase (e.g., `Location`, `Product`, `StockTransaction`)
- **Fields**: Column names, their types, and nullability
- **Enums**: Any domain-specific enum values (e.g., status, type)
- **Nested children**: Sub-entities that belong to this entity
- **Relations**: JOINed entities for the Output DTO
- **Update style**: Partial of Create or specific fields

---

## File Structure

Every DTO file MUST follow this exact section ordering:

```
1. Imports
2. ENUM        — Domain-specific enums
3. NESTED      — Child/supporting schemas
4. ENTITY      — Full database row representation
5. FILTER      — HTTP query parameter validation
6. OUTPUT      — Entity + joined relations (response shape)
7. CREATE      — Input for creation
8. UPDATE      — Input for update
```

Only include sections that are needed. Skip sections with no content.

---

## Section Templates

### Imports

```typescript
import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/core/validation'

// External module DTOs (if needed)
import { OtherEntityDto } from '@/modules/other-module/dto'

// Internal module DTOs (if needed)
import { SiblingDto } from './sibling.dto'
```

**Import order rules:**
1. `zod` first
2. Blank line
3. `@/core/validation` helpers
4. Blank line
5. External module DTOs (`@/modules/...`)
6. Internal module DTOs (`./...`)

---

### ENUM Section

```typescript
/* ---------------------------------- ENUM ---------------------------------- */

const LocationType = z.enum(['store', 'warehouse'])
type LocationType = z.infer<typeof LocationType>
```

**Rules:**
- Naming: `{EntityField}` in PascalCase (e.g., `LocationType`, `ProductStatus`, `TransactionType`)
- Use `const` (do NOT export) unless the enum is needed by another module
- Always include the `type` declaration merging line

---

### NESTED Section

For child/supporting entities that belong to the main entity:

```typescript
/* --------------------------------- NESTED --------------------------------- */

const MaterialConversionDto = z.object({
  toBaseFactor: zPrimitive.decimal,
  uomId: zPrimitive.id,
  uom: UomDto.optional(),
})

type MaterialConversionDto = z.infer<typeof MaterialConversionDto>
```

**Rules:**
- Naming: `{Parent}{Child}Dto` (e.g., `RecipeItemDto`, `ProductVariantDto`)
- Use `const` + `type` (not `export`) unless the nested DTO is used by other modules
- If the nested DTO is used externally, use `export`

---

### ENTITY Section

Represents a full database row:

```typescript
/* --------------------------------- ENTITY --------------------------------- */

export const LocationDto = z.object({
  id: zPrimitive.id,
  code: zPrimitive.codeUpper,
  name: zPrimitive.str,
  type: LocationType,
  description: zPrimitive.strNullable,
  isActive: zPrimitive.bool,
  ...zSchema.metadata.shape,
})

export type LocationDto = z.infer<typeof LocationDto>
```

**Rules:**
- Naming: `{Entity}Dto`
- `id` is always the FIRST field
- Always spread `...zSchema.metadata.shape` at the END (adds `createdBy`, `updatedAt`, etc.)
- Always `export` both const and type
- Use declaration merging (type name = const name)

---

### FILTER Section

For HTTP query parameter validation:

```typescript
/* --------------------------------- FILTER --------------------------------- */

export const LocationFilterDto = z.object({
  search: zHttp.query.search,
  type: LocationType.optional(),
  isActive: zHttp.query.boolean,
  categoryId: zHttp.query.id.optional(),
})

export type LocationFilterDto = z.infer<typeof LocationFilterDto>
```

**Rules:**
- Naming: `{Entity}FilterDto`
- ALL fields must be optional
- Use `zHttp.query.*` for query string coercion
- For search: `zHttp.query.search`

---

### OUTPUT Section

For response shapes that include joined relations:

```typescript
/* ---------------------------------- OUTPUT -------------------------------- */

export const MaterialOutputDto = z.object({
  ...MaterialDto.shape,
  category: MaterialCategoryDto.nullable(),
  uom: UomDto.nullable(),
  locations: LocationDto.array().optional(),
})

export type MaterialOutputDto = z.infer<typeof MaterialOutputDto>
```

**Rules:**
- Naming: `{Entity}OutputDto`
- Always spread `...{Entity}Dto.shape` as the base
- Section header is `OUTPUT`, NOT `RESULT` or `SELECT`

---

### CREATE Section

```typescript
/* --------------------------------- CREATE --------------------------------- */

export const LocationCreateDto = z.object({
  ...LocationDto.pick({
    code: true,
    name: true,
    type: true,
    description: true,
    isActive: true,
  }).shape,
})

export type LocationCreateDto = z.infer<typeof LocationCreateDto>
```

---

### UPDATE Section

```typescript
/* --------------------------------- UPDATE --------------------------------- */

export const LocationUpdateDto = LocationCreateDto.partial()

export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>
```

---

## Primitive Type Reference

Use `zPrimitive.*` for ALL field types. NEVER use raw `z.string()`, `z.number()`, `z.boolean()` in DTOs.

### Base Types

| Primitive | Zod Schema | Use For |
|-----------|-----------|---------|
| `zPrimitive.str` | `z.string().trim()` | Names, SKUs, codes, reference numbers, general text |
| `zPrimitive.strNullable` | `z.string().trim().nullable()` | Description, notes, nullable text fields |
| `zPrimitive.id` | `z.coerce.number().int().positive()` | Serial PK / FK integer IDs |
| `zPrimitive.bool` | `z.boolean()` | Boolean flags |
| `zPrimitive.decimal` | `z.string().trim()` | Monetary amounts stored as Decimal string |

### HTTP Query Helpers

| Helper | Schema | Use For |
|--------|--------|---------|
| `zHttp.query.search` | `str.optional().transform(empty→undefined)` | Search text input |
| `zHttp.query.boolean` | `enum('true','false').transform().optional().catch()` | Boolean query params |
| `zHttp.pagination` | `{ page, limit }` with defaults | Pagination params |
| `zHttp.recordId` | `{ id }` | Route param ID |

### Response Helpers

| Helper | Use For |
|--------|---------|
| `zResponse.ok(DataSchema)` | Standard success response |
| `zResponse.paginated(DataSchema)` | Paginated list response |

---

## Complete Example

```typescript
import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const LocationDto = z.object({
  id: zPrimitive.id,
  code: zPrimitive.codeUpper,
  name: zPrimitive.str,
  isActive: zPrimitive.bool,
  ...zSchema.metadata.shape,
})

export type LocationDto = z.infer<typeof LocationDto>

/* --------------------------------- FILTER --------------------------------- */

export const LocationFilterDto = z.object({
  search: zHttp.query.search,
  isActive: zHttp.query.boolean,
})

export type LocationFilterDto = z.infer<typeof LocationFilterDto>

/* ---------------------------------- OUTPUT -------------------------------- */

export const LocationOutputDto = z.object({
  ...LocationDto.shape,
  // Joined fields...
})

export type LocationOutputDto = z.infer<typeof LocationOutputDto>

/* --------------------------------- CREATE --------------------------------- */

export const LocationCreateDto = z.object({
  ...LocationDto.pick({
    code: true,
    name: true,
    isActive: true,
  }).shape,
})

export type LocationCreateDto = z.infer<typeof LocationCreateDto>

/* --------------------------------- UPDATE --------------------------------- */

export const LocationUpdateDto = LocationCreateDto.partial()

export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>
```
