# 🚀 Server → Web Generator: Quick Start

Auto-generate web DTOs & APIs dari server contract dalam **1 command**.

## ⚡ 30-Second Quick Start

```bash
# 1. Define server contract first
apps/server/src/modules/location/location.contract.ts ✓

# 2. Run generator
bun generate:web location

# 3. Web layer ready!
apps/web/src/features/location/dto/location.dto.ts  ✓
apps/web/src/features/location/api/location.api.ts  ✓
```

## 📋 Typical Workflow

```
1. Create Server Module
   └─ location.contract.ts (define schemas)
   └─ location.service.ts (business logic)
   └─ location.route.ts (HTTP routes)

2. Generate Web Layer (1 command)
   └─ bun generate:web location
   └─ ✨ Auto-generated:
      ├─ location.dto.ts (DTO schemas)
      └─ location.api.ts (API endpoints + query keys)

3. Build Web Components
   └─ Use generated DTO for forms
   └─ Use generated API in React Query
```

## 📁 What Gets Generated

**Input:** `apps/server/src/modules/location/location.contract.ts`

**Output 1 - DTO:**
```typescript
// apps/web/src/features/location/dto/location.dto.ts

export const LocationTypeDto = z.enum(['store', 'warehouse'])
export const LocationDto = z.object({ ... })
export const LocationCreateDto = z.object({ ... })
export const LocationUpdateDto = z.object({ ... })
export const LocationFilterDto = z.object({ ... })
```

**Output 2 - API:**
```typescript
// apps/web/src/features/location/api/location.api.ts

export const locationApi = {
  list: apiFactory({ ... }),      // GET /location/list
  detail: apiFactory({ ... }),    // GET /location/detail
  create: apiFactory({ ... }),    // POST /location/create
  update: apiFactory({ ... }),    // PUT /location/update
  remove: apiFactory({ ... }),    // DELETE /location/remove
}
```

## 🎯 Common Commands

```bash
# Preview what will be generated (no changes)
bun generate:web location --dry-run

# Generate and write files
bun generate:web location

# See output in console (useful for debugging)
bun generate:web:preview location

# Debug what the parser extracts
bun scripts/debug-parser.ts location
```

## ✅ Key Benefits

✓ **Zero Manual Sync** - Server contract is source of truth  
✓ **Type Safe** - Auto-converted Zod schemas  
✓ **Consistent** - Same patterns every module  
✓ **Fast** - 1 command, 5 seconds  
✓ **Safe** - Dry-run before applying  

## 🔧 Customization After Generation

Generated files are **scaffolding**, not locked in:

```typescript
// Generated files are a starting point
export const locationApi = {
  list: apiFactory({ ... }),   // From generator
  create: apiFactory({ ... }), // From generator
  
  // Add custom endpoints as needed
  archive: apiFactory({
    method: 'post',
    url: endpoint.location.archive,
    body: zc.RecordId,
    result: createSuccessResponseSchema(zc.RecordId),
    invalidates: [locationKeys.lists()],
  }),
}
```

## 📚 Documentation

- **Full Guide:** [GENERATOR_GUIDE.md](./scripts/GENERATOR_GUIDE.md)
- **Architecture:** [GENERATOR_OVERVIEW.md](./GENERATOR_OVERVIEW.md)
- **Server Patterns:** [apps/server/docs/CODE_PATTERNS.md](./apps/server/docs/CODE_PATTERNS.md)

## 🛟 Troubleshooting

**Q: "Server contract not found"**  
A: Ensure `apps/server/src/modules/[module]/[module].contract.ts` exists first.

**Q: "Generated DTO looks wrong"**  
A: Check with dry-run first: `bun generate:web location --dry-run`

**Q: "Need to update after server contract changes"**  
A: Just run `bun generate:web location` again - it overwrites existing files.

---

**Created:** 2026-06-28  
**Status:** Production Ready  
**Version:** 1.0
