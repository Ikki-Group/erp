# 🎯 Server → Web Generator

**Automated code generation** - Transform server contracts into web DTOs & APIs instantly.

```
Your Server                Auto-Generate          Ready for Web
Contract (1 file)     ────────────────→     DTO + API (2 files)
```

## 🚀 One-Minute Start

```bash
# Create server module (or use existing)
bun generate:web location          # ✨ Done! Web layer ready

# What you get:
# - apps/web/src/features/location/dto/location.dto.ts
# - apps/web/src/features/location/api/location.api.ts
```

## 📦 What's Included

| File | Purpose |
|------|---------|
| `scripts/generate-web-from-server.ts` | Main generator (reads server contract, writes web files) |
| `scripts/lib/contract-parser.ts` | Parser (extracts enums, schemas, fields from Zod) |
| `scripts/preview-generation.ts` | Preview mode (console output without side effects) |
| `scripts/debug-parser.ts` | Debug utility (see what parser extracts) |
| `scripts/GENERATOR_GUIDE.md` | Full reference documentation |
| `GENERATOR_QUICK_START.md` | 30-second quick start |
| `GENERATOR_OVERVIEW.md` | Architecture & deep dive |

## 🔄 How It Works

### Phase 1: Parse Server Contract
```typescript
// Input: apps/server/src/modules/location/location.contract.ts

export const LocationTypeEnum = z.enum(['store', 'warehouse'])
export const LocationDto = z.object({ id, code, name, type, ... })
const LocationMutationDto = z.object({ code, name, type, ... })
export const LocationFilterDto = z.object({ q, type?, ...pagination })
```

**Parser extracts:**
- ✓ Enums & their values
- ✓ All schemas (entity, create, update, filter)
- ✓ Field types, nullability, defaults
- ✓ Type mapping for enum conversions

### Phase 2: Generate Web DTO
```typescript
// Output: apps/web/src/features/location/dto/location.dto.ts

export const LocationTypeDto = z.enum(['store', 'warehouse'])
export const LocationDto = z.object({ ...zc.RecordId.shape, code, name, type, ... })
export const LocationCreateDto = z.object({ code, name, type, ... })
export const LocationUpdateDto = z.object({ ...zc.RecordId.shape, ...createDto })
export const LocationFilterDto = z.object({ q, ...pagination })
```

**Generation includes:**
- ✓ Enum naming conversion (Enum → Dto)
- ✓ Entity schema (with spreads for id, audit fields)
- ✓ Create schema (mutation fields)
- ✓ Update schema (id + mutation)
- ✓ Filter schema (search + pagination)

### Phase 3: Generate Web API
```typescript
// Output: apps/web/src/features/location/api/location.api.ts

export const locationApi = {
  list: apiFactory({ method: 'get', url: endpoint.location.list, ... }),
  detail: apiFactory({ method: 'get', url: endpoint.location.detail, ... }),
  create: apiFactory({ method: 'post', url: endpoint.location.create, ... }),
  update: apiFactory({ method: 'put', url: endpoint.location.update, ... }),
  remove: apiFactory({ method: 'delete', url: endpoint.location.remove, ... }),
}
```

**Generation includes:**
- ✓ Query key factory
- ✓ Standard CRUD operations
- ✓ Parameter validation (Zod schemas)
- ✓ Response type definitions
- ✓ Cache invalidation rules

## 📊 Usage Examples

### Example 1: Generate New Module

```bash
# 1. Create server module
cd apps/server/src/modules
mkdir material
cat > material/material.contract.ts << 'EOF'
export const MaterialTypeEnum = z.enum(['raw', 'finished'])
export const MaterialDto = z.object({
  id: zp.id,
  code: zp.str,
  name: zp.str,
  type: MaterialTypeEnum,
  unit: zp.str,
  ...zc.AuditBasic.shape,
})
const MaterialMutationDto = z.object({
  code: zc.strTrim,
  name: zc.strTrim,
  type: MaterialTypeEnum,
  unit: zc.strTrim,
  isActive: zp.bool.default(true),
})
export const MaterialCreateDto = MaterialMutationDto
export const MaterialUpdateDto = z.object({
  id: zp.id,
  ...MaterialMutationDto.shape,
})
export const MaterialFilterDto = z.object({
  q: zq.search,
  type: MaterialTypeEnum.optional(),
  ...zq.pagination.shape,
})
EOF

# 2. Generate web layer
cd /path/to/root
bun generate:web material

# 3. Web layer ready!
✓ apps/web/src/features/material/dto/material.dto.ts
✓ apps/web/src/features/material/api/material.api.ts
```

### Example 2: Update Existing Contract

```bash
# Server contract changed:
# - Added: category field
# - New enum: StatusEnum

apps/server/src/modules/location/location.contract.ts
# ... (update contract) ...

# Regenerate web layer
bun generate:web location

# Web layer auto-updated ✓
```

### Example 3: Preview Before Applying

```bash
# See what will be generated
bun generate:web location --dry-run

# Output:
# 📦 Generating web layer for module: location
# 📖 Parsing server contract...
#    • Enums found: 1
#    • Schemas found: 4
# 🔨 Generating web DTO...
#    [DRY-RUN] Would create: apps/web/src/features/location/dto/location.dto.ts
# 🔨 Generating web API layer...
#    [DRY-RUN] Would create: apps/web/src/features/location/api/location.api.ts

# Looks good? Apply it:
bun generate:web location
```

### Example 4: Console Preview

```bash
# Output to console (no files written)
bun generate:web:preview location

# Shows exactly what will be in each file
# Useful for reviewing or debugging
```

## ✅ Benefits

| Benefit | Before | After |
|---------|--------|-------|
| **Manual Sync** | Write DTO + API manually | Auto-generated |
| **Time** | 20 min per module | 5 seconds |
| **Errors** | Manual mistakes | Type-safe from contract |
| **Consistency** | Manual patterns | Guaranteed patterns |
| **Updates** | Sync manually | `bun generate:web` |

## 🛠️ Commands

```bash
# Main commands
bun generate:web [module]                # Generate & write
bun generate:web [module] --dry-run      # Preview only (no changes)
bun generate:web [module] --force        # Overwrite existing (careful!)

# Preview & debug
bun generate:web:preview [module]        # Console output
bun scripts/debug-parser.ts [module]     # See parsed data

# Examples
bun generate:web location
bun generate:web location --dry-run
bun generate:web:preview material
bun scripts/debug-parser.ts product
```

## 📋 Typical Workflow

```
1️⃣ Create Server Module
   └─ apps/server/src/modules/[name]/[name].contract.ts
   └─ Define all schemas with Zod

2️⃣ Run Generator
   └─ bun generate:web [name]
   └─ Takes 5 seconds

3️⃣ Web Layer Ready
   ├─ apps/web/src/features/[name]/dto/[name].dto.ts ✓
   └─ apps/web/src/features/[name]/api/[name].api.ts ✓

4️⃣ Build Components
   ├─ Use generated DTO for form validation
   ├─ Use generated API in React Query
   └─ Custom logic in components

5️⃣ Server Changes?
   └─ bun generate:web [name] (re-run anytime)
   └─ Web layer auto-synced
```

## 🔍 Advanced Features

### Custom Endpoints (Post-Generation)

Generated API is a starting point. Add custom endpoints after:

```typescript
// Generated base
export const locationApi = {
  list: apiFactory({ ... }),
  create: apiFactory({ ... }),
}

// Add custom endpoint
export const locationApi = {
  ...locationApi,  // Keep generated endpoints
  
  // Add your custom logic
  assignUser: apiFactory({
    method: 'post',
    url: endpoint.location.assignUser,
    body: z.object({ locationId: zc.RecordId, userId: zc.RecordId }),
    result: createSuccessResponseSchema(zc.RecordId),
    invalidates: [locationKeys.lists()],
  }),
}
```

### Type Mapping

Generator auto-maps server types to web:

| Server | Web | Details |
|--------|-----|---------|
| `LocationTypeEnum` | `LocationTypeDto` | Enum naming |
| `zp.id` | `zc.RecordId` | ID type |
| `zc.strTrim` | `zc.strTrim` | Validator preserved |
| `.nullable()` | `.nullable()` | Modifier preserved |
| `.default(true)` | `.default(true)` | Default preserved |

### Debug Mode

See exactly what parser extracts:

```bash
bun scripts/debug-parser.ts location

# Output:
# 🎯 Enums:
#   • LocationTypeEnum → LocationTypeDto
#     Values: store, warehouse
# 📋 Schemas:
#   • LocationDto (entity: true, mutation: false)
#     Fields: 8
#       - id: id
#       - code: str
#       - name: str
#       ...
```

## 🚨 Common Issues

### Q: "Server contract not found"

**Solution:** Ensure file exists at:
```
apps/server/src/modules/[module]/[module].contract.ts
```

### Q: "Generated file has wrong fields"

**Solution:** Use dry-run to preview:
```bash
bun generate:web [module] --dry-run
```

### Q: "Need to add custom fields"

**Solution:** Edit generated file after creation (it's not locked):
```typescript
// Generated: apps/web/src/features/[module]/dto/[module].dto.ts

export const MyDto = z.object({
  // Generated fields...
  
  // Add custom fields
  customField: z.string(),
})
```

## 📚 Documentation

- **Quick Start** → [GENERATOR_QUICK_START.md](./GENERATOR_QUICK_START.md)
- **Full Guide** → [scripts/GENERATOR_GUIDE.md](./scripts/GENERATOR_GUIDE.md)
- **Architecture** → [GENERATOR_OVERVIEW.md](./GENERATOR_OVERVIEW.md)
- **Server Patterns** → [apps/server/docs/CODE_PATTERNS.md](./apps/server/docs/CODE_PATTERNS.md)

## 🔗 Related

- Server Module Template → [apps/server/docs/MODULE_TEMPLATE.md](./apps/server/docs/MODULE_TEMPLATE.md)
- Server Patterns → [apps/server/docs/CODE_PATTERNS.md](./apps/server/docs/CODE_PATTERNS.md)
- Architecture → [apps/server/docs/ARCHITECTURE.md](./apps/server/docs/ARCHITECTURE.md)

## 🎉 Summary

**One command.** Auto-generate web layer from server contract.

```bash
bun generate:web location
```

**Result:** Consistent DTOs + APIs, zero manual sync, 5 seconds.

---

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Created:** 2026-06-28
