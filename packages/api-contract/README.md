# @ikki/api-contract

Shared API contract types and validators for Ikki ERP.

## Structure

- **core/** - Core TypeScript types (pagination, audit, common)
- **validation/** - Zod validators (primitive, common, query)

## Usage

```typescript
// Import core types
import { PaginationQuery, AuditFull } from '@ikki/api-contract/core'

// Import validators
import { zc, zp, zq } from '@ikki/api-contract/validation'
```

## Development

```bash
# Build
bun run build

# Type check
bun run typecheck

# Watch mode
bun run dev
```

## Migration Status

**Foundation:** ✅ Complete
- Package structure created
- Core types extracted
- Validation schemas extracted
- Package builds successfully
- Usage example works

**Migration to Server/Web:** ⚠️ Blocked
- TypeScript workspace type resolution issues
- Types from @ikki/api-contract resolve as `unknown` in workspace context
- Requires additional TypeScript configuration or build setup

**Next Steps for Migration:**
1. Investigate Bun workspace type resolution
2. Consider using built dist files instead of source files
3. Or use a different approach for sharing types (e.g., copy-based with CI validation)
