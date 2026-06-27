# 🚀 Simple Generator Guide

**Straightforward approach:** Copy-paste server contract → change import → done.

## ⚡ Quick Start (30 seconds)

```bash
# 1. Create server contract (or update it)
apps/server/src/modules/location/location.contract.ts ✓

# 2. Generate web DTO (1 command)
bun generate:web location

# 3. Web DTO ready!
✓ apps/web/src/features/location/dto/location.dto.ts
  (copy of server contract with import changed)
```

## 📝 What It Does

**Input:** Server contract
```typescript
// apps/server/src/modules/location/location.contract.ts
import { z } from 'zod'
import { zc, zp, zq } from '@/shared/schema'

export const LocationTypeEnum = z.enum(['store', 'warehouse'])

export const LocationDto = z.object({
  id: zp.id,
  code: zp.str,
  name: zp.str,
  type: LocationTypeEnum,
  ...zc.AuditBasic.shape,
})

// ... more schemas ...
```

**Output:** Web DTO (identical + changed import)
```typescript
// apps/web/src/features/location/dto/location.dto.ts
import { z } from 'zod'
import { zc, zp, zq } from '@/lib/validation'  // ← ONLY CHANGE

export const LocationTypeEnum = z.enum(['store', 'warehouse'])

export const LocationDto = z.object({
  id: zp.id,
  code: zp.str,
  name: zp.str,
  type: LocationTypeEnum,
  ...zc.AuditBasic.shape,
})

// ... exact same schemas ...
```

**That's it!** Direct copy-paste approach.

## 🔧 Commands

```bash
# Generate & write files
bun generate:web location

# Preview without writing (dry-run)
bun generate:web location --dry-run

# Examples
bun generate:web material
bun generate:web material --dry-run
bun generate:web product
```

## 💡 Why This Approach?

✅ **Simple** - No transformations, just copy-paste  
✅ **Predictable** - Output is exactly what you see in server  
✅ **Maintainable** - Easy to understand what changed  
✅ **Safe** - Server contract is source of truth  
✅ **Fast** - 1 command, 2 seconds

## 📊 Workflow

```
1. Create Server Module
   ├─ Define contract.ts with all schemas
   └─ Use standard Zod patterns

2. Run Generator
   └─ bun generate:web [module]

3. Web DTO Ready
   ├─ Identical to server contract
   ├─ Import changed to @/lib/validation
   └─ Ready to use immediately

4. For API Layer (manual or future)
   ├─ Use generated DTO in apiFactory
   ├─ Create endpoints manually
   └─ Or future: auto-generate API too
```

## 🎯 What Gets Generated

Only **one file** per module:
```
apps/web/src/features/[module]/dto/[module].dto.ts
├─ All schemas from server contract
├─ All enums from server contract
├─ Import changed to @/lib/validation
└─ index.ts auto-updated
```

## ✨ Key Points

1. **No complex transformations** - Copy-paste logic
2. **Import path only change** - `@/shared/schema` → `@/lib/validation`
3. **All schemas included** - Entity, Create, Update, Filter, etc.
4. **Index auto-updated** - Exports ready to use
5. **Safe to re-run** - Overwrites old version

## 🛟 FAQ

**Q: Do I need to manually create API layer?**  
A: Yes, that's separate. This generator only handles DTO (schemas). API layer can be manual or future enhancement.

**Q: What if server contract changes?**  
A: Just run `bun generate:web [module]` again. It overwrites the web DTO.

**Q: Can I customize generated DTO?**  
A: Yes, it's just a file. After generation, edit as needed. But next `bun generate:web` will overwrite.

**Q: What about enums naming?**  
A: They stay exactly the same. If server has `LocationTypeEnum`, web will too. No transformation.

**Q: Does it generate API endpoints?**  
A: Not yet. Just DTO schemas. API layer is manual currently.

## 📚 Documentation

- **This file** - Simple guide (you are here)
- **Full reference** - See GENERATOR_README.md for advanced info
- **Server patterns** - apps/server/docs/CODE_PATTERNS.md

## 🎁 Benefits

| Aspect | Benefit |
|--------|---------|
| Time | Copy-paste logic is fast (~2 sec) |
| Consistency | DTO exactly matches server contract |
| Maintainability | Easy to understand (no magic) |
| Safety | Server is source of truth |
| Updates | Re-run anytime contract changes |

---

**Simple, fast, predictable.** That's it!

```bash
bun generate:web location
```

Done. 🎉
