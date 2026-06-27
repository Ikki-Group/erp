# Server → Web Generator: Complete Overview

Solusi otomasi untuk generate web layer (DTO + API) dari server contract.

## 🎯 Problem & Solution

### Problem
- Server defines contract: `location.contract.ts` dengan schemas & enums
- Web perlu maintain **matching** schemas dalam web layer
- Manual sync = 2x boilerplate, 2x maintenance, mudah inconsistent

### Solution
```
Server Contract     Auto-Generate     Web Layer
  .contract.ts   ───────────────→  DTO + API
                                   (ready to use)
```

**Generator parses server contract** dan generates:
1. Web DTO (`location.dto.ts`) - Zod schemas dengan web conventions
2. Web API (`location.api.ts`) - Endpoints, query keys, cache invalidation

## 📁 Project Structure

```
scripts/
├── generate-web-from-server.ts      ← Main generator script
├── lib/
│   └── contract-parser.ts           ← Parse server contract (enums, schemas, fields)
├── preview-generation.ts             ← Preview output before applying
└── GENERATOR_GUIDE.md               ← Detailed usage guide

Server Module:
apps/server/src/modules/
└── location/
    ├── location.contract.ts          ← Input: Server schemas
    ├── location.service.ts
    ├── location.route.ts
    └── location.repo.ts

Web Feature:
apps/web/src/features/
└── location/
    ├── dto/
    │   ├── location.dto.ts           ← Generated: Web schemas
    │   └── index.ts                  ← Auto-updated export
    ├── api/
    │   ├── location.api.ts           ← Generated: API endpoints
    │   └── index.ts                  ← Auto-updated export
    ├── components/                   ← Manual: React components
    └── hooks/                        ← Manual: Custom hooks
```

## 🚀 Quick Start

```bash
# 1. Create server module first (if new)
cd apps/server
# ... implement location.contract.ts, location.service.ts, etc.

# 2. Generate web layer
bun generate:web location

# 3. Web DTO + API ready to use
# Continue building components...
```

## 📊 Parsing Flow

### Input: Server Contract
```typescript
// apps/server/src/modules/location/location.contract.ts

export const LocationTypeEnum = z.enum(['store', 'warehouse'])

export const LocationDto = z.object({
  id: zp.id,
  code: zp.str,
  name: zp.str,
  type: LocationTypeEnum,
  ...zc.AuditBasic.shape,
})

const LocationMutationDto = z.object({
  code: zc.strTrim,
  name: zc.strTrim.min(3).max(100),
  type: LocationTypeEnum,
  isActive: zp.bool.default(true),
})

export const LocationCreateDto = LocationMutationDto
export const LocationUpdateDto = z.object({
  id: zp.id,
  ...LocationMutationDto.shape,
})

export const LocationFilterDto = z.object({
  q: zq.search,
  type: LocationTypeEnum.optional(),
  ...zq.pagination.shape,
})
```

### Parse Phase 1: Extract Enums
```
LocationTypeEnum = z.enum(['store', 'warehouse'])
    ↓
LocationTypeDto = z.enum(['store', 'warehouse'])  // Enum → Dto naming
```

### Parse Phase 2: Extract Schemas & Fields
```
LocationDto {
  id: zp.id              ↓ Extract fields, types, nullable, optional
  code: zp.str
  name: zp.str
  type: LocationTypeEnum
  ...
}
    ↓
LocationDto = { code, name, type, ... }
LocationCreateDto = { code, name, type, isActive }
LocationUpdateDto = { id, ...createDto }
LocationFilterDto = { q, type?, ...pagination }
```

### Parse Phase 3: Build Type Mapping
```
LocationTypeEnum → LocationTypeDto    (for field type conversion)
zp.str → zp.str                       (validator mapping)
zc.strTrim → zc.strTrim
etc.
```

## 🔨 Generation Flow

### Generate Web DTO
```typescript
// Generated: apps/web/src/features/location/dto/location.dto.ts

import { z, zc, zp, zq } from '@ikki/api-contract/validation'

// 1. Enums: Enum → Dto conversion
export const LocationTypeDto = z.enum(['store', 'warehouse'])
export type LocationTypeDto = z.infer<typeof LocationTypeDto>

// 2. Entity DTO: Extract entity fields
export const LocationDto = z.object({
  ...zc.RecordId.shape,        // id
  code: zp.str,                 // from LocationDto
  name: zp.str,
  type: LocationTypeDto,        // mapped enum
  ...zc.AuditBasic.shape,       // createdBy, updatedBy, etc.
})
export type LocationDto = z.infer<typeof LocationDto>

// 3. Create DTO: Mutation fields + defaults
export const LocationCreateDto = z.object({
  code: zc.strTrim,             // from LocationMutationDto
  name: zc.strTrim.min(3).max(100),
  type: LocationTypeDto,
  isActive: zp.bool.default(true),
})
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

// 4. Update DTO: id + create fields
export const LocationUpdateDto = z.object({
  ...zc.RecordId.shape,
  ...LocationCreateDto.shape
})
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>

// 5. Filter DTO: Query parameters
export const LocationFilterDto = z.object({
  q: zq.search,
  ...zq.pagination.shape,
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>
```

### Generate Web API
```typescript
// Generated: apps/web/src/features/location/api/location.api.ts

import { apiFactory, createQueryKeys } from '@/lib/api'
import { endpoint } from '@/config/endpoint'

const locationKeys = createQueryKeys('location', 'master')

export const locationApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.location.list,
    params: z.object({ ...zq.pagination.shape, ...LocationFilterDto.shape }),
    result: createPaginatedResponseSchema(LocationDto),
    queryKey: locationKeys.list,
  }),

  detail: apiFactory({
    method: 'get',
    url: endpoint.location.detail,
    params: zc.RecordId,
    result: createSuccessResponseSchema(LocationDto),
    queryKey: (params) => locationKeys.detail(params?.id),
  }),

  create: apiFactory({
    method: 'post',
    url: endpoint.location.create,
    body: LocationCreateDto,
    result: createSuccessResponseSchema(zc.RecordId),
    invalidates: [locationKeys.lists()],
  }),

  update: apiFactory({
    method: 'put',
    url: endpoint.location.update,
    body: LocationUpdateDto,
    result: createSuccessResponseSchema(zc.RecordId),
    invalidates: [
      locationKeys.lists(),
      ({ body }) => locationKeys.detail(body.id),
    ],
  }),

  remove: apiFactory({
    method: 'delete',
    url: endpoint.location.remove,
    body: zc.RecordId,
    result: createSuccessResponseSchema(zc.RecordId),
    invalidates: [
      locationKeys.lists(),
      ({ body }) => locationKeys.detail(body.id),
    ],
  }),
}
```

## 💡 Key Features

### ✅ Automatic Type Conversion
- Server enums (`LocationTypeEnum`) → Web (`LocationTypeDto`)
- Server validators (`zc.strTrim`) → Web validators (preserved)
- Maintains nullable/optional modifiers

### ✅ Smart Field Extraction
- Parses Zod schemas to extract individual fields
- Ignores spreads (`...zc.AuditBasic.shape`)
- Handles multi-line definitions & comments

### ✅ Standard CRUD Operations
- List + pagination
- Detail by ID
- Create
- Update by ID
- Remove by ID

### ✅ Cache Invalidation
- Auto-generated invalidation rules
- Invalidate lists on mutation
- Invalidate specific detail on update

### ✅ Query Key Management
- Automatic query key factory
- List & detail hierarchies
- Ready for React Query

## 🛡️ Safety Features

### Dry-Run Mode
```bash
bun generate:web location --dry-run
# Preview output without writing files
```

### Preview Mode
```bash
bun generate:web:preview location
# Output to console (no side effects)
```

### Index Auto-Update
```typescript
// Automatically updated
export * from './location.dto'
export * from './location.api'
```

## 📝 Usage Examples

### Example 1: New Module
```bash
# 1. Create server module
apps/server/src/modules/material/
  ├── material.contract.ts      ✓ Define schemas
  ├── material.repo.ts
  ├── material.service.ts
  └── material.route.ts

# 2. Generate web layer
$ bun generate:web material
✅ Generated web DTO
✅ Generated web API
✅ Updated index exports

# 3. Start building components
apps/web/src/features/material/
  ├── dto/material.dto.ts        ✓ Ready to use
  ├── api/material.api.ts        ✓ Ready to use
  ├── components/
  │   ├── material-list.tsx      ← Build this
  │   ├── material-form.tsx      ← Build this
  │   └── material-detail.tsx    ← Build this
```

### Example 2: Update Existing Contract
```bash
# Server contract changed (new field, new enum value)
apps/server/src/modules/location/location.contract.ts
  ↓ Added: country field, Added: zip field

# Regenerate web
$ bun generate:web location
✅ DTO updated with new fields
✅ API updated if needed

# Components automatically use new fields (via dto)
```

## 🔄 Type Mapping Reference

| Server Type | Web Type | Example |
|---|---|---|
| `z.enum()` | `z.enum()` | `LocationTypeEnum` → `LocationTypeDto` |
| `zp.id` | `zc.RecordId` | Serial ID type |
| `zp.str` | `zp.str` | Non-empty string |
| `zc.strTrim` | `zc.strTrim` | Trimmed string validator |
| `zp.bool` | `zp.bool` | Boolean |
| `zp.int` | `zp.int` | Integer number |
| `.nullable()` | `.nullable()` | Can be null |
| `.optional()` | `.optional()` | Can be undefined |
| `...zc.AuditBasic.shape` | `...zc.AuditBasic.shape` | Audit fields (preserved) |

## 🚨 Common Patterns

### Pattern 1: Enum Usage
```typescript
// Server: export const StatusEnum = z.enum(['active', 'inactive'])
// Web: export const StatusDto = z.enum(['active', 'inactive'])

export const ProductDto = z.object({
  status: StatusDto,  // Auto-converted type
})
```

### Pattern 2: Mutation with Defaults
```typescript
// Server
const ProductMutationDto = z.object({
  name: zc.strTrim,
  sku: zc.strTrim,
  isActive: zp.bool.default(true),
})

// Web: Preserves defaults
export const ProductCreateDto = z.object({
  name: zc.strTrim,
  sku: zc.strTrim,
  isActive: zp.bool.default(true),
})
```

### Pattern 3: Nullable Fields
```typescript
// Server
export const MaterialDto = z.object({
  description: zp.str.nullable(),
  notes: zc.strTrimNullable,
})

// Web: Nullable preserved
export const MaterialDto = z.object({
  description: zp.str.nullable(),
  notes: zc.strTrimNullable,
})
```

## 🔧 Extensibility

Generated code is **scaffolding**, not locked in:

```bash
# 1. Generate base files
bun generate:web product

# 2. Manually add custom endpoints if needed
export const productApi = {
  // Generated endpoints
  list: apiFactory({ ... }),
  create: apiFactory({ ... }),
  
  // Custom endpoint (added manually)
  archive: apiFactory({
    method: 'post',
    url: endpoint.product.archive,
    body: zc.RecordId,
    result: createSuccessResponseSchema(zc.RecordId),
    invalidates: [productKeys.lists(), ({ body }) => productKeys.detail(body.id)],
  }),
}
```

## 📋 Workflow Summary

1. **Server-First Design**
   - Define contract in server
   - Run generator
   - Web DTO + API ready

2. **Type Safety**
   - Both layers use same Zod validators
   - Compile-time type checking
   - No manual sync needed

3. **Consistency**
   - Single source of truth (server contract)
   - Auto-generated = no drift
   - Easy to audit (generator is transparent)

4. **Maintainability**
   - Change server contract once
   - Run generator
   - Web layer auto-updates
   - No manual synchronization

## 🎓 Next Steps

1. **Try it out**
   ```bash
   bun generate:web location --dry-run
   bun generate:web location
   ```

2. **Check generated files**
   ```bash
   cat apps/web/src/features/location/dto/location.dto.ts
   cat apps/web/src/features/location/api/location.api.ts
   ```

3. **Build components**
   - Use generated DTO for form validation
   - Use generated API in React Query

4. **Future enhancements**
   - Auto-generate form schemas
   - Auto-generate React Query hooks
   - Auto-generate component templates

---

**Created:** 2026-06-28  
**Type:** Development Tool  
**Status:** Ready for use
