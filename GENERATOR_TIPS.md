# 🚀 Generator Tips & Optimization Guide

**How to make API contract & DTO generation even easier.**

## 📋 Overview: Generation Workflow

```
Step 1: Server Routes       → Step 2: Endpoint Config → Step 3: Web DTO
        .route.ts                    endpoint.ts                .dto.ts
        (manual)                     (AUTO ✨)                  (AUTO ✨)
```

## ✨ What's Automated Now

### 1. **Endpoint Config Generation** (NEW!)

**Before:** Manual update to `endpoint.ts` every time you add routes
```typescript
// apps/web/src/config/endpoint.ts
// ❌ Manual: You need to remember to add new modules
const location = crud('location')
const material = crud('material')
// ... easy to forget ...
```

**After:** Auto-generated from server routes
```bash
bun generate:endpoints
# ✓ Scans all server route files
# ✓ Extracts routes automatically
# ✓ Generates endpoint.ts
# ✓ No manual updates needed!
```

**How it works:**
1. Parse server `[module].route.ts` files
2. Extract prefix: `new Elysia({ prefix: '/location' })`
3. Extract routes: `.get('/list', ...)` → `/location/list`
4. Detect standard CRUD pattern → use `crud()` helper
5. Generate `endpoint.ts` with all routes

**Result:**
```typescript
// Generated automatically!
const location = crud('location')
const material = crud('material')
const sales_type = crud('sales-type')

export const endpoint = {
  location,
  material,
  ['sales-type']: sales_type,
}
```

### 2. **Web DTO Generation** (Existing)

```bash
bun generate:web location
# ✓ Copies server contract
# ✓ Changes import to @/lib/validation
# ✓ Creates web DTO
```

---

## 🔄 Complete Workflow

### Scenario: Adding New Module (`product`)

**Step 1: Create Server Module**
```bash
cd apps/server/src/modules
mkdir product

cat > product/product.contract.ts << 'EOF'
import { z } from 'zod'
import { zc, zp, zq } from '@/shared/schema'

export const ProductTypeEnum = z.enum(['simple', 'bundle'])
export const ProductDto = z.object({
  id: zp.id,
  name: zp.str,
  type: ProductTypeEnum,
  ...zc.AuditBasic.shape,
})
// ... more schemas ...
EOF

# Create service, repo, route files...
# In product.route.ts:
// new Elysia({ prefix: '/product' })
//   .get('/list', ...)
//   .post('/create', ...)
//   etc.
```

**Step 2: Generate Everything**
```bash
# One command generates BOTH endpoint config AND web DTO!
bun generate:web

# Automatically:
# ✓ Scans product.route.ts
# ✓ Updates endpoint.ts (adds product endpoints)
# ✓ Generates product.dto.ts (copies contract, changes import)
# ✓ Updates product/dto/index.ts exports
```

**Step 3: Use in Web**
```typescript
// apps/web/src/features/product/api/product.api.ts
import { endpoint } from '@/config/endpoint'
import { productApi, ProductCreateDto, ProductDto } from '../dto'

export const productApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.product.list,      // ✓ Auto-generated endpoint
    params: ProductFilterDto,          // ✓ Auto-generated DTO
    result: createPaginatedResponseSchema(ProductDto),
  }),
  // ... other endpoints ...
}
```

---

## 🎯 All Generator Commands

```bash
# Auto-generate everything (endpoints + DTOs)
bun generate:web

# Just generate endpoint config from routes
bun generate:endpoints

# Preview endpoint generation (no changes)
bun generate:endpoints --dry-run

# Generate/update specific module DTO
bun generate:web product

# Preview DTO generation (no changes)
bun generate:web product --dry-run
```

---

## 💡 Tips for Smooth Generation

### Tip 1: Structure Server Routes Consistently

**Good:**
```typescript
// product.route.ts
export function createProductRoute(m: ProductModule) {
  return new Elysia({ prefix: '/product' })
    .get('/list', async ({ query }) => { ... })
    .get('/detail', async ({ query }) => { ... })
    .post('/create', async ({ body, auth }) => { ... })
    .put('/update', async ({ body, auth }) => { ... })
    .delete('/remove', async ({ body }) => { ... })
}
```

**Why:** Generator detects standard CRUD pattern and uses `crud('product')` helper in endpoint.ts.

### Tip 2: Define Contract Before Routes

**Flow:**
1. Create `contract.ts` with all schemas first
2. Then create `route.ts` that uses those schemas
3. Then run `bun generate:web`

**Why:** Ensures DTOs and routes are always in sync.

### Tip 3: Run Generation After Route Changes

**When to re-run:**
- Added new route
- Changed route prefix
- Renamed route endpoint
- Added/removed CRUD operations

**Command:**
```bash
bun generate:web  # Updates both endpoint.ts AND DTOs
```

### Tip 4: Verify Generation Before Commit

**Safe workflow:**
```bash
# 1. Preview what will be generated
bun generate:endpoints --dry-run
bun generate:web [module] --dry-run

# 2. If looks good, apply
bun generate:endpoints
bun generate:web [module]

# 3. Review changes
git diff apps/web/src/config/endpoint.ts
git diff apps/web/src/features/*/dto/*.dto.ts

# 4. Commit
git add .
git commit -m "feat: update routes and generated configs"
```

### Tip 5: Use Editor Shortcuts

**VS Code:**
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Generate Web",
      "type": "shell",
      "command": "bun",
      "args": ["generate:web"],
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

Then: `Cmd+Shift+B` → "Generate Web" → Done!

---

## 🛡️ Validation & Safety

### Tip 6: Validate Generation Works

```bash
# Run after generation
git diff apps/web/src/config/endpoint.ts  # Should see new endpoints
git diff apps/web/src/features/*/dto/     # Should see new DTOs

# If endpoint.ts is empty or broken:
# Check that server routes have proper prefix defined
# Check that route files exist in correct location
```

### Tip 7: Handle Edge Cases

**Module with custom routes (not standard CRUD):**
```typescript
// iam.route.ts - custom endpoints
export function createIamRoute(m: IamModule) {
  return new Elysia({ prefix: '/iam' })
    .post('/login', ...)            // Custom
    .post('/logout', ...)           // Custom
    .put('/change-password', ...)   // Custom
}
```

Generated endpoint config will include all custom endpoints:
```typescript
const iam = {
  login: 'iam/login',
  logout: 'iam/logout',
  changePassword: 'iam/change-password',
}
```

**Module with hyphenated name:**
```typescript
// sales-type.route.ts
// Generated as:
const sales_type = crud('sales-type')

export const endpoint = {
  ['sales-type']: sales_type,  // Bracket notation for hyphenated names
}
```

---

## 🚀 Advanced: Generate Only What Changed

**Scenario:** You updated `product.route.ts` but only want to update product endpoints.

```bash
# Generate specific module (fast!)
bun generate:web product

# This will:
# ✓ Re-scan server routes (finds all modules)
# ✓ Update endpoint.ts (entire file re-generated)
# ✓ Generate product.dto.ts (if contract changed)
```

**Note:** Endpoint generation always regenerates entire `endpoint.ts` file (safer than partial updates).

---

## 📚 File Reference

| File | Purpose | Auto-Generated? |
|------|---------|---|
| `apps/server/src/modules/[m]/[m].contract.ts` | Zod schemas | Manual ✏️ |
| `apps/server/src/modules/[m]/[m].route.ts` | Elysia routes | Manual ✏️ |
| `apps/web/src/config/endpoint.ts` | Endpoint config | **AUTO** ✨ |
| `apps/web/src/features/[m]/dto/[m].dto.ts` | Web schemas | **AUTO** ✨ |
| `apps/web/src/features/[m]/api/[m].api.ts` | API factories | Manual ✏️ (for now) |

---

## ✅ Checklist: New Module

```
[ ] 1. Create apps/server/src/modules/[module]/[module].contract.ts
[ ] 2. Create apps/server/src/modules/[module]/[module].route.ts
[ ] 3. Create apps/server/src/modules/[module]/[module].service.ts
[ ] 4. Create apps/server/src/modules/[module]/[module].repo.ts
[ ] 5. Run: bun generate:web          ← Generates endpoint.ts + DTO!
[ ] 6. Verify: git diff
[ ] 7. Create apps/web/src/features/[module]/api/[module].api.ts
[ ] 8. Create apps/web/src/features/[module]/components/*
[ ] 9. Test
[ ] 10. Commit
```

---

## 🎁 Benefits Summary

| Benefit | Before | After |
|---------|--------|-------|
| Endpoint updates | Manual | Auto-generated ✨ |
| Time per module | 30 min | 5 sec ✨ |
| Forget to update endpoint.ts | Happens often | Never ✨ |
| DTO sync | Manual | Auto-generated ✨ |
| Breaking changes caught | Late (runtime) | Early (generation) ✨ |

---

## 🔮 Future Enhancements

- [ ] Auto-generate API factories from routes
- [ ] Validation sync checker (pre-commit)
- [ ] Smart module checklist
- [ ] IDE JSDoc hints for endpoints

---

## 📖 Related Documentation

- **[GENERATOR_FINAL.md](./GENERATOR_FINAL.md)** - How generator works
- **[SIMPLE_GENERATOR_GUIDE.md](./SIMPLE_GENERATOR_GUIDE.md)** - Quick start
- **[apps/server/docs/CODE_PATTERNS.md](./apps/server/docs/CODE_PATTERNS.md)** - Server patterns

---

**TL;DR:**
```bash
# Create server module, then:
bun generate:web

# ✓ Endpoint config auto-generated
# ✓ Web DTO auto-generated
# ✓ Ready to build components!
```

Done! 🎉

