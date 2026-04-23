# IAM Module - Quick Start Guide

## 🎯 What's New

Three new files create a more scalable, maintainable structure:

| File | Purpose | Usage |
|------|---------|-------|
| `errors.ts` | Typed error classes | `throw new UserNotFoundError(id)` |
| `constants.ts` | System constants & cache keys | `IAM_CACHE_KEYS.USER_LIST` |
| `validators.ts` | Business logic validation | `await UserValidator.checkCreateConflicts(data)` |

## 📋 TL;DR - Before & After

### Errors
```typescript
// ❌ OLD: In service file
const err = { notFound: (id) => new NotFoundError(...) }

// ✅ NEW: In errors.ts
export class UserNotFoundError extends NotFoundError { ... }
```

### Constants
```typescript
// ❌ OLD: Magic numbers scattered
const PLACEHOLDER_ID = 999999
const SUPERADMIN_ROLE_ID = 1

// ✅ NEW: In constants.ts
export const SYSTEM_ROLES = { SUPERADMIN_ID: 1 }
export const IAM_CONFIG = { SUPERADMIN_PLACEHOLDER_ID: 999999 }
```

### Validation
```typescript
// ❌ OLD: In service file
await core.checkConflict({ table, pkColumn, fields, input })

// ✅ NEW: In validators.ts
await UserValidator.checkCreateConflicts(data)
```

### Service Organization
```typescript
// ✅ NEW: Clear sections
export class UserService {
  /* QUERY OPERATIONS */
  async getList() ...
  async getById(id) ...
  
  /* COMMAND OPERATIONS */
  async handleCreate(data, actorId) ...
  async handleUpdate(id, data, actorId) ...
  
  /* HANDLER OPERATIONS */
  async handleList(filter) ...
  
  /* INTERNAL */
  private async clearCache() ...
}
```

## 🚀 How to Use

### In Services
```typescript
import { UserNotFoundError, UserConflictError } from '../errors'
import { UserValidator } from '../validators'
import { IAM_CACHE_KEYS, SYSTEM_ROLES } from '../constants'

export class UserService {
  async handleCreate(data: UserCreateDto, actorId: number) {
    // Validate
    await UserValidator.checkCreateConflicts(data)
    
    // Error handling
    if (!user) throw new UserNotFoundError(id)
    
    // Cache management
    await cache.deleteMany({ keys: [IAM_CACHE_KEYS.USER_LIST] })
  }
}
```

### In Routers
```typescript
// No changes needed - routers work as before
```

## 📁 File Structure

```
iam/
├── errors.ts              ← Use for all error classes
├── constants.ts           ← Use for all constants & cache keys
├── validators.ts          ← Use for validation logic
├── STANDARDS.md           ← Read for detailed guide
├── BEFORE_AFTER.md        ← See why this matters
├── IMPLEMENTATION_SUMMARY.md ← Overview of changes
└── ... (other files unchanged)
```

## ✅ Checklist

- [x] `errors.ts` created with all error classes
- [x] `constants.ts` created with unified constants
- [x] `validators.ts` created with business validators
- [x] `user.service.ts` refactored with new imports
- [x] Methods organized (QUERY → COMMAND → HANDLER → INTERNAL)
- [x] Linting passes (0 errors, 0 warnings)
- [x] Documentation complete

## 🔄 Next: Apply to Other Modules

To apply the same pattern to **Role** or **Assignment** modules:

1. Create `role/errors.ts` - copy pattern from `user/errors.ts`
2. Update `role.service.ts` - same reorganization
3. Update `role/validators.ts` - copy pattern from `user/validators.ts`

Time estimate: **15-20 minutes per module**

## ❓ FAQ

**Q: Do I need to change my router code?**
A: No! Routers work as-is. Service method signatures are unchanged.

**Q: Can I add more validators?**
A: Yes! Add new validator objects to `validators.ts` as needed.

**Q: What if I need module-specific errors?**
A: Add them to `errors.ts` following the same pattern.

**Q: Should I refactor other modules now?**
A: Optional. Test this pattern first, then apply if it works well.

## 📚 Learn More

- `STANDARDS.md` - Complete implementation guide
- `BEFORE_AFTER.md` - Detailed before/after comparison
- `IMPLEMENTATION_SUMMARY.md` - Full summary with metrics

## 🎓 Key Principles

1. **Centralization** - One source of truth per concept
2. **Organization** - Methods grouped by intent (QUERY/COMMAND/HANDLER)
3. **Type Safety** - Typed errors instead of magic strings
4. **Simplicity** - Pragmatic, not over-engineered
5. **Consistency** - Same pattern across all modules

---

Ready to explore? Start with `STANDARDS.md` for the full picture.
