# Server → Web Generator Guide

Automated code generation dari server contract ke web layer untuk mengurangi manual work dan maintain consistency.

## 🎯 What It Does

Generator ini **parse server contract** dan **auto-generate**:

1. **Web DTO** (`apps/web/src/features/[module]/dto/[module].dto.ts`) - Zod schemas untuk web
2. **Web API** (`apps/web/src/features/[module]/api/[module].api.ts`) - API endpoints & query keys

Jadi saat kamu membuat module baru atau update contract, cukup jalankan generator 1x dan web layer sudah ready.

## 🚀 Quick Start

### Generate untuk module baru (atau update existing)

```bash
# DRY-RUN: Preview what will be generated
bun scripts/generate-web-from-server.ts location --dry-run

# WRITE: Actually create/update files
bun scripts/generate-web-from-server.ts location

# FORCE: Overwrite existing files (careful!)
bun scripts/generate-web-from-server.ts location --force
```

### Preview output tanpa side effects

```bash
# Lihat exactly apa yang akan di-generate (preview mode)
bun scripts/preview-generation.ts location
```

## 📖 How It Works

### Parsing Phase

```
location.contract.ts
    ↓
Parse enums:   LocationTypeEnum → LocationTypeDto
Parse schemas: LocationDto, LocationCreateDto, LocationUpdateDto, LocationFilterDto
Extract fields dengan tipe, nullable, optional
    ↓
ParsedContract
```

### Generation Phase

**DTO Generation:**

- Convert enums: `Enum` → `Dto`
- Extract entity fields dari `LocationDto`
- Extract mutation fields dari `LocationCreateDto`
- Generate web Dto, CreateDto, UpdateDto, FilterDto dengan proper validators

**API Generation:**

- Create query keys
- Generate 5 standard endpoints:
  - `list` - with pagination + filter
  - `detail` - with id param
  - `create` - with body validation
  - `update` - with body + id
  - `remove` - with id

## 📋 Example: Location Module

### Server Contract (input)

```typescript
// apps/server/src/modules/location/location.contract.ts

export const LocationTypeEnum = z.enum(['store', 'warehouse'])

export const LocationDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: LocationTypeEnum,
	description: zp.str.nullable(),
	address: zp.str.nullable(),
	phone: zp.str.nullable(),
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})

const LocationMutationDto = z.object({
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeEnum,
	description: zc.strTrimNullable,
	address: zc.strTrimNullable,
	phone: zc.strTrimNullable,
	isActive: zp.bool.default(true),
})
```

### Generated Web DTO (output)

```typescript
// apps/web/src/features/location/dto/location.dto.ts

import { z, zc, zp, zq } from '@ikki/api-contract/validation'

export const LocationTypeDto = z.enum(['store', 'warehouse'])
export type LocationTypeDto = z.infer<typeof LocationTypeDto>

export const LocationDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	type: LocationTypeDto,
	description: zp.strNullable,
	address: zp.strNullable,
	phone: zp.strNullable,
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type LocationDto = z.infer<typeof LocationDto>

export const LocationCreateDto = z.object({
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeDto,
	description: zc.strTrimNullable,
	address: zc.strTrimNullable,
	phone: zc.strTrimNullable,
	isActive: zp.bool.default(true),
})
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

export const LocationUpdateDto = z.object({
	...zc.RecordId.shape,
	...LocationCreateDto.shape,
})
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>

export const LocationFilterDto = z.object({
	q: zq.search,
	...zq.pagination.shape,
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>
```

### Generated Web API (output)

```typescript
// apps/web/src/features/location/api/location.api.ts

import { ... } from '@ikki/api-contract/validation'
import { endpoint } from '@/config/endpoint'
import { apiFactory, createQueryKeys } from '@/lib/api'
import { LocationCreateDto, LocationDto, LocationFilterDto, LocationUpdateDto } from '../dto'

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
    invalidates: [locationKeys.lists(), ({ body }) => locationKeys.detail(body.id)],
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.location.remove,
    body: zc.RecordId,
    result: createSuccessResponseSchema(zc.RecordId),
    invalidates: [locationKeys.lists(), ({ body }) => locationKeys.detail(body.id)],
  }),
}
```

## 🔄 Workflow: Adding New Features

### Option A: Server-First (Recommended)

1. **Create server module** dengan contract, repo, service, route
2. **Run generator**
   ```bash
   bun scripts/generate-web-from-server.ts material-category
   ```
3. **Web DTO + API auto-generated** ✅
4. **Build web components** (forms, pages) manually dengan generated DTO/API
5. **Run tests & verify**

### Option B: Manual Fine-tuning

Generator creates boilerplate. For custom needs:

```bash
# 1. Generate base files
bun scripts/generate-web-from-server.ts product

# 2. Review & customize as needed
# - Add custom query keys
# - Add special endpoints
# - Adjust validators

# 3. Ready to use
```

## 🛠️ Type Mapping

Generator maps server types → web validators automatically:

| Server        | Web           | Notes                   |
| ------------- | ------------- | ----------------------- |
| `z.enum()`    | `z.enum()`    | Converted to Dto suffix |
| `zp.id`       | `zc.RecordId` | Auto-mapped             |
| `zp.str`      | `zp.str`      | Direct mapping          |
| `zc.strTrim`  | `zc.strTrim`  | Reusable validators     |
| `.nullable()` | `.nullable()` | Preserved               |
| `.optional()` | `.optional()` | Preserved               |

## ⚙️ Configuration

### Project Structure Expected

```
Server:
  apps/server/src/modules/[module]/[module].contract.ts

Web:
  apps/web/src/features/[module]/dto/[module].dto.ts
  apps/web/src/features/[module]/api/[module].api.ts
```

### Customization

Edit `scripts/generate-web-from-server.ts` untuk:

- Change endpoint pattern
- Adjust CRUD operations
- Add custom invalidation rules

## 🐛 Troubleshooting

### "Server contract not found"

```bash
✗ Buat server module dulu sebelum generate web
✓ Pastikan file ada di apps/server/src/modules/[module]/[module].contract.ts
```

### "Generated file looks wrong"

```bash
# 1. Review dengan dry-run dulu
bun scripts/generate-web-from-server.ts [module] --dry-run

# 2. Check preview
bun scripts/preview-generation.ts [module]

# 3. Update contract di server jika perlu
```

### Type mapping tidak akurat

- Update `mapServerTypeToWeb()` di generator
- Atau manually fix web DTO setelah generate

## 📝 Next Steps

- [ ] Add support untuk custom endpoints (non-CRUD)
- [ ] Generate form schemas otomatis
- [ ] Generate React Query hooks
- [ ] Add schema validation & type checking
- [ ] Generate component templates (list, form, detail)

## 🔗 Related

- [SERVER - CODE_PATTERNS.md](../apps/server/docs/CODE_PATTERNS.md) - Server contract patterns
- [MODULE_TEMPLATE.md](../apps/server/docs/MODULE_TEMPLATE.md) - Create new modules
- [API Configuration](../apps/web/src/config/endpoint.ts) - Web endpoints config

---

**Last Updated:** 2026-06-28  
**Creator:** Claude Code  
**Type:** Dev Tool
