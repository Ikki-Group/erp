---
name: server-dto
description: Generate DTO (Data Transfer Object) files with Zod v4 following Ikki ERP naming, structure, and validation conventions
---

# Server DTO Generator

This skill generates DTO files using Zod v4 that follow the Ikki ERP conventions for naming, structure, section ordering, and validation primitives.

## When to Use

Use this skill when:

- Creating a new DTO file for a new entity
- Adding DTO sections (Filter, Result, Mutation) to an existing entity
- Reviewing or refactoring existing DTOs for convention compliance
- Unsure which `zPrimitive` / `zHttp` helper to use for a field

## Input Required

When asked to create a DTO, gather this information:

- **Entity name**: PascalCase (e.g., `Location`, `Product`, `StockTransaction`)
- **Fields**: Column names, their types, and nullability
- **Enums**: Any domain-specific enum values (e.g., status, type)
- **Nested children**: Sub-entities that belong to this entity
- **Relations**: JOINed entities for the Result/Select DTO
- **Mutation style**: Generic (`MutationDto`) or specific (`CreateDto` + `UpdateDto`)

---

## File Structure

Every DTO file MUST follow this exact section ordering:

```
1. Imports
2. ENUM        — Domain-specific enums
3. NESTED      — Child/supporting schemas
4. ENTITY      — Full database row representation
5. FILTER      — HTTP query parameter validation
6. RESULT      — Entity + joined relations (response shape)
7. MUTATION    — Create/update body validation
```

Only include sections that are needed. Skip sections with no content.

---

## Section Templates

### Imports

```typescript
import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

// External module DTOs (if needed)
import { OtherEntityDto } from '@/modules/other-module/dto'

// Internal module DTOs (if needed)
import { SiblingDto } from './sibling.dto'
```

**Import order rules:**
1. `zod` first
2. Blank line
3. `@/lib/validation` helpers
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
- Always spread `...zSchema.metadata.shape` at the END (adds `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `syncAt`)
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
- ALL fields must be optional (user should not be forced to filter)
- Use `zHttp.query.*` for query string coercion, NEVER raw `z.string()...`
- For enum filters: `{EnumSchema}.optional()`
- For boolean: `zHttp.query.boolean` (already includes `.optional().catch(undefined)`)
- For optional IDs: `zHttp.query.id.optional()`
- For search: `zHttp.query.search`

---

### RESULT Section

For response shapes that include joined relations:

```typescript
/* --------------------------------- RESULT --------------------------------- */

export const MaterialSelectDto = z.object({
  ...MaterialDto.shape,
  category: MaterialCategoryDto.nullable(),
  uom: UomDto.nullable(),
  locations: LocationDto.array().optional(),
})

export type MaterialSelectDto = z.infer<typeof MaterialSelectDto>
```

**Rules:**
- Naming: `{Entity}SelectDto`
- Always spread `...{Entity}Dto.shape` as the base
- 1:1 relations → `.nullable()` (LEFT JOIN can return null)
- 1:N relations → `.array()`
- Optional includes → add `.optional()` after `.nullable()` or `.array()`
- Section header is `RESULT`, NOT `SELECT` or `COMMON`
- Skip this section entirely if the entity has no joined relations

---

### MUTATION Section

#### Option A: Generic MutationDto (Create & Update are identical)

```typescript
/* -------------------------------- MUTATION -------------------------------- */

export const LocationMutationDto = z.object({
  ...LocationDto.pick({
    code: true,
    name: true,
    type: true,
    description: true,
    isActive: true,
  }).shape,
})

export type LocationMutationDto = z.infer<typeof LocationMutationDto>
```

#### Option B: Separate CreateDto + UpdateDto (Create & Update differ)

```typescript
/* -------------------------------- MUTATION -------------------------------- */

export const UserCreateDto = z.object({
  ...UserDto.pick({
    email: true,
    username: true,
    fullname: true,
    isRoot: true,
    isActive: true,
  }).shape,
  password: zPrimitive.password,
  assignments: z.array(UserAssignmentUpsertDto).default([]),
})

export type UserCreateDto = z.infer<typeof UserCreateDto>

export const UserUpdateDto = z.object({
  ...UserCreateDto.omit({ password: true }).shape,
  password: zPrimitive.password.optional(),
})

export type UserUpdateDto = z.infer<typeof UserUpdateDto>
```

#### Nested Mutation Items

```typescript
const RecipeItemMutationDto = z.object({
  materialId: zPrimitive.id,
  qty: zPrimitive.decimal,
  scrapPercentage: zPrimitive.decimal.optional().default('0'),
  uomId: zPrimitive.id,
  notes: zPrimitive.str.optional(),
  sortOrder: zPrimitive.sortOrder.optional().default(0),
})

type RecipeItemMutationDto = z.infer<typeof RecipeItemMutationDto>

export const RecipeMutationDto = z.object({
  // ... parent fields
  items: RecipeItemMutationDto.array(),
})
```

**Mutation Rules:**
- Always derive from Entity via `.pick({...}).shape` — keeps mutation synced with entity
- Use `z.object({ ...Entity.pick({...}).shape })` pattern (NOT `Entity.pick({...})` directly) so you can add extra fields
- Nested child mutations are `const` (no export) unless needed externally
- Naming: `{Entity}MutationDto` OR `{Entity}CreateDto`/`{Entity}UpdateDto`
- Use `MutationDto` when create & update schemas are identical
- Use `CreateDto` + `UpdateDto` when they differ

#### Mutation with Refinement (business rules)

```typescript
export const RecipeMutationDto = z
  .object({
    materialId: zPrimitive.id.optional().nullable(),
    productId: zPrimitive.id.optional().nullable(),
    items: RecipeItemMutationDto.array(),
  })
  .refine(
    (data) => {
      const targets = [data.materialId, data.productId].filter((t) => t != null)
      return targets.length === 1
    },
    {
      message: 'Must have exactly one target',
      path: ['materialId'],
    }
  )
```

---

## Primitive Type Reference

Use `zPrimitive.*` for ALL field types. NEVER use raw `z.string()`, `z.number()`, `z.boolean()` in DTOs.

### Base Types

| Primitive | Zod Schema | Use For |
|-----------|-----------|---------|
| `zPrimitive.str` | `z.string().trim()` | Names, SKUs, codes, reference numbers, general text |
| `zPrimitive.strNullable` | `z.string().trim().nullable()` + empty→null | Description, notes, nullable text fields |
| `zPrimitive.num` | `z.number()` | Quantities, counts, numeric values |
| `zPrimitive.numCoerce` | `z.coerce.number()` | Numbers from string input (query params) |
| `zPrimitive.date` | `z.coerce.date()` | Date/timestamp fields |
| `zPrimitive.bool` | `z.boolean()` | Boolean flags (isActive, isSystem, isDefault) |
| `zPrimitive.id` | `z.coerce.number().int().positive()` | Serial PK / FK integer IDs |
| `zPrimitive.uuid` | `z.uuidv7()` | UUID v7 identifiers |
| `zPrimitive.email` | `z.email()` + lowercase | Email fields |

### Domain-Specific Types

| Primitive | Zod Schema | Use For |
|-----------|-----------|---------|
| `zPrimitive.decimal` | `z.string().trim()` | Prices, monetary amounts, quantities stored as Decimal string |
| `zPrimitive.sortOrder` | `z.number().int().nonnegative()` | Display ordering / sort position |
| `zPrimitive.codeUpper` | `z.string().trim().toUpperCase()` | Uppercase codes (e.g., location codes) |
| `zPrimitive.password` | `z.string().trim().min(8).max(100)` | Password fields |
| `zPrimitive.username` | `z.string().trim().min(3).max(50)` + lowercase | Username fields |

### Critical: `str` vs `decimal`

- **`zPrimitive.str`** → for actual TEXT (names, SKUs, descriptions, reference numbers)
- **`zPrimitive.decimal`** → for NUMBERS stored as strings (prices, costs, quantities, factors, percentages)

> If the field represents a numeric value but is stored/transmitted as a string, use `decimal`.

### HTTP Query Helpers

| Helper | Schema | Use For |
|--------|--------|---------|
| `zHttp.query.search` | `str.optional().transform(empty→undefined)` | Search text input |
| `zHttp.query.boolean` | `enum('true','false').transform().optional().catch()` | Boolean query params |
| `zHttp.query.id` | Same as `zPrimitive.id` | ID from query string |
| `zHttp.query.ids` | Preprocess single/array → `id[]` | Multiple IDs from query |
| `zHttp.query.num` | Same as `zPrimitive.numCoerce` | Number from query string |
| `zHttp.pagination` | `{ page, limit }` with defaults | Pagination params |
| `zHttp.recordId` | `{ id }` | Route param ID |

### Schema Helpers

| Helper | Fields | Use For |
|--------|--------|---------|
| `zSchema.metadata` | `createdBy, updatedBy, createdAt, updatedAt, syncAt` | Audit trail on entities |
| `zSchema.recordId` | `{ id }` | Record ID wrapper |

### Response Helpers

| Helper | Use For |
|--------|---------|
| `zResponse.ok(DataSchema)` | Standard success response |
| `zResponse.paginated(DataSchema)` | Paginated list response |

---

## Section Header Format

Use this EXACT format for all section headers (80 chars wide):

```
/* ---------------------------------- ENUM ---------------------------------- */
/* --------------------------------- NESTED --------------------------------- */
/* --------------------------------- ENTITY --------------------------------- */
/* --------------------------------- FILTER --------------------------------- */
/* --------------------------------- RESULT --------------------------------- */
/* -------------------------------- MUTATION -------------------------------- */
```

For mutation sub-sections in complex files:

```
/* ─────────────────── MUTATION: NESTED ITEMS ──────────────────── */
/* ──────────────────── MUTATION: BATCH OPS ────────────────────── */
```

---

## Complete Example: Simple Entity

```typescript
import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

/* ---------------------------------- ENUM ---------------------------------- */

const LocationType = z.enum(['store', 'warehouse'])
type LocationType = z.infer<typeof LocationType>

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

/* --------------------------------- FILTER --------------------------------- */

export const LocationFilterDto = z.object({
  search: zHttp.query.search,
  type: LocationType.optional(),
  isActive: zHttp.query.boolean,
})

export type LocationFilterDto = z.infer<typeof LocationFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const LocationMutationDto = z.object({
  ...LocationDto.pick({
    code: true,
    name: true,
    type: true,
    description: true,
    isActive: true,
  }).shape,
})

export type LocationMutationDto = z.infer<typeof LocationMutationDto>
```

## Complete Example: Complex Entity with Nested Children

```typescript
import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

import { MaterialCategoryDto } from './material-category.dto'
import { UomDto } from './uom.dto'

/* ---------------------------------- ENUM ---------------------------------- */

const MaterialType = z.enum(['raw', 'semi'])
type MaterialType = z.infer<typeof MaterialType>

/* --------------------------------- NESTED --------------------------------- */

const MaterialConversionDto = z.object({
  toBaseFactor: zPrimitive.decimal,
  uomId: zPrimitive.id,
  uom: UomDto.optional(),
})

type MaterialConversionDto = z.infer<typeof MaterialConversionDto>

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialDto = z.object({
  id: zPrimitive.id,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.id.nullable(),
  baseUomId: zPrimitive.id,

  locationIds: zPrimitive.id.array(),
  conversions: MaterialConversionDto.array(),
  ...zSchema.metadata.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterDto = z.object({
  search: zHttp.query.search,
  type: MaterialType.optional(),
  categoryId: zHttp.query.id.optional(),
  locationIds: zHttp.query.ids,
})

export type MaterialFilterDto = z.infer<typeof MaterialFilterDto>

/* --------------------------------- RESULT --------------------------------- */

export const MaterialSelectDto = z.object({
  ...MaterialDto.shape,
  category: MaterialCategoryDto.nullable(),
  uom: UomDto.nullable(),
})

export type MaterialSelectDto = z.infer<typeof MaterialSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialMutationDto = z.object({
  ...MaterialDto.pick({
    name: true,
    description: true,
    sku: true,
    type: true,
    categoryId: true,
    baseUomId: true,
    conversions: true,
  }).shape,
})

export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>
```

---

## Validation Checklist

After generating a DTO file, verify:

- [ ] Sections are in order: ENUM → NESTED → ENTITY → FILTER → RESULT → MUTATION
- [ ] Section headers use the exact 80-char format
- [ ] All schema + type pairs use declaration merging (same name)
- [ ] Entity uses `zPrimitive.*` (never raw `z.string()`, `z.number()`, etc.)
- [ ] Entity spreads `...zSchema.metadata.shape` at the end
- [ ] Filter uses `zHttp.query.*` for all fields
- [ ] Filter fields are all optional
- [ ] Result extends Entity via `...{Entity}Dto.shape`
- [ ] Mutation derives from Entity via `.pick({...}).shape`
- [ ] Monetary / decimal fields use `zPrimitive.decimal` (not `zPrimitive.str`)
- [ ] Sort order fields use `zPrimitive.sortOrder` (not `zPrimitive.num`)
- [ ] Enums use `const` (no export) unless needed by other modules
- [ ] Nested child DTOs use `const` unless needed externally
- [ ] Both `const` and `type` are exported together for all public schemas
