# ✨ Server → Web Generator (Final Version)

**Simple, Fast, Predictable.**

Auto-generate web DTOs from server contracts with a single command.

```bash
bun generate:web location
# ✓ Web DTO ready in 2 seconds
```

## 🎯 What It Does

Copy server contract → Change import path → Done.

**Input:** `apps/server/src/modules/location/location.contract.ts`
```typescript
import { z } from 'zod'
import { zc, zp, zq } from '@/shared/schema'

export const LocationTypeEnum = z.enum(['store', 'warehouse'])
export const LocationDto = z.object({ ... })
// ... more schemas ...
```

**Output:** `apps/web/src/features/location/dto/location.dto.ts`
```typescript
import { z } from 'zod'
import { zc, zp, zq } from '@/lib/validation'  // ← Only change

export const LocationTypeEnum = z.enum(['store', 'warehouse'])
export const LocationDto = z.object({ ... })
// ... exact same schemas ...
```

That's it. **Direct copy-paste.** No transformations.

## ⚡ 30-Second Start

```bash
# 1. You have: server contract
#    apps/server/src/modules/location/location.contract.ts

# 2. Run generator
bun generate:web location

# 3. You get: web DTO
#    apps/web/src/features/location/dto/location.dto.ts
#    (with import changed to @/lib/validation)
```

## 🔧 Usage

```bash
# Generate & write
bun generate:web location

# Preview first (no changes)
bun generate:web location --dry-run

# More examples
bun generate:web material
bun generate:web product
bun generate:web [any-module]
```

## 📊 What Gets Generated

**Per module:**
- `apps/web/src/features/[module]/dto/[module].dto.ts` - All schemas
- `apps/web/src/features/[module]/dto/index.ts` - Auto-updated exports

**What's included:**
- All enums (unchanged naming)
- All schemas (Dto, CreateDto, UpdateDto, FilterDto)
- All types (inferred from Zod)
- Import changed: `@/shared/schema` → `@/lib/validation`

## ✨ Key Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Manual sync | 20 min per module | 0 (auto-generated) |
| Copy-paste mistakes | Yes | No |
| Update on changes | Manual re-sync | `bun generate:web` |
| Consistency | Manual patterns | Guaranteed |
| Time | 20 minutes | 2 seconds |

## 🔄 Typical Workflow

```
Step 1: Create Server Module
  └─ Define schemas in location.contract.ts

Step 2: Generate Web DTO
  └─ bun generate:web location

Step 3: Use in Web Components
  ├─ Import from generated DTO
  ├─ Use in form validation
  ├─ Use in React Query mutations
  └─ Create custom API layer if needed

Step 4: Server Contract Changes?
  └─ bun generate:web location (re-run)
  └─ Web DTO auto-updated
```

## 🛠️ Implementation

**File:** `scripts/generate-web-from-server-v2.ts`

**Logic:**
1. Read server contract
2. Replace import path: `@/shared/schema` → `@/lib/validation`
3. Write to web feature directory
4. Update index.ts exports

**That's all.** No parsing, no transformations, no complex logic.

## 📝 Examples

### Example 1: Generate Material DTO

```bash
$ bun generate:web material

📦 Generating web DTO for module: material
📖 Reading server contract...
🔨 Generating web DTO...
   ✓ Created: apps/web/src/features/material/dto/material.dto.ts
   ✓ Updated: apps/web/src/features/material/dto/index.ts

✅ Generation completed successfully!
```

### Example 2: Preview Before Applying

```bash
$ bun generate:web product --dry-run

📦 Generating web DTO for module: product
   Mode: 👀 DRY-RUN
📖 Reading server contract...
🔨 Generating web DTO...
   [DRY-RUN] Would create: ...

📋 Preview (first 50 lines):
--- (shows output) ---
```

### Example 3: Use Generated DTO

```typescript
// apps/web/src/features/location/components/form.tsx
import { LocationCreateDto, LocationUpdateDto } from '../dto'

export function LocationForm() {
  return (
    <form>
      <input {...register('code')} />
      <input {...register('name')} />
      <select {...register('type')}>
        <option value="store">Store</option>
        <option value="warehouse">Warehouse</option>
      </select>
    </form>
  )
}
```

## ✅ Safety Features

**Dry-run mode:** Preview without changes
```bash
bun generate:web location --dry-run
```

**Index auto-updated:** No manual exports needed
```typescript
// apps/web/src/features/location/dto/index.ts
export * from './location.dto'
```

**Re-run safe:** Overwrites old version
```bash
bun generate:web location  # Run again anytime
```

## 🤔 FAQ

**Q: How do I generate for a new module?**  
A: Create `apps/server/src/modules/[name]/[name].contract.ts` first, then `bun generate:web [name]`

**Q: What if I need to customize the generated DTO?**  
A: Edit the file after generation. It's just a regular file.

**Q: Will re-running overwrite my changes?**  
A: Yes. If you need to preserve changes, don't re-run generator.

**Q: Can I generate API layer too?**  
A: Not yet. This is just for DTOs. API layer is manual or future enhancement.

**Q: How is this different from v1?**  
A: v1 was complex (parsing, transforming). v2 is simple (copy-paste approach).

## 📚 Documentation

- **This file** - Final reference
- **SIMPLE_GENERATOR_GUIDE.md** - Beginner-friendly guide
- **GENERATOR_README.md** - Comprehensive reference
- **Server docs** - apps/server/docs/CODE_PATTERNS.md

## 🎉 Summary

```
One command.
Two seconds.
Web DTO ready.

bun generate:web [module]
```

Simple. Fast. Predictable.

---

**Version:** 2.0 (Simple approach)  
**Status:** ✅ Production ready  
**Created:** 2026-06-28
