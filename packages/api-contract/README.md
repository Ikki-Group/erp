# @ikki/api-contract

Shared API contract types and validators for Ikki ERP.

## Structure

- **core/** - Core TypeScript types (pagination, audit, common)
- **validation/** - Zod validators (primitive, common, query, response)

## Status

**Foundation:** ✅ Complete
- Package structure created
- Core types extracted
- Validation schemas extracted
- Response schema creators added
- `z` re-exported for consumer use
- Package builds successfully

**Integration Status:** ✅ Location Module Migrated
- `apps/server/src/modules/location` uses `@ikki/api-contract/validation`
- Typecheck passes cleanly for location module

## Consumer Usage

### Import DTO builders and shared schemas

```typescript
import { z, zc, zp, zq } from '@ikki/api-contract/validation'

export const MyCreateDto = z.object({
  name: zc.strTrim.min(3).max(100),
  email: zc.email,
  isActive: zp.bool.default(true),
})
```

### Import response schema creators

```typescript
import {
  createSuccessResponseSchema,
  createPaginatedResponseSchema,
  zc,
} from '@ikki/api-contract/validation'

const responseSchema = createSuccessResponseSchema(zc.RecordId)
```

## DX Workflow

When modifying `@ikki/api-contract`, consumers must rebuild before typechecking:

```bash
# 1. Edit api-contract source files
# 2. Rebuild the package
cd packages/api-contract && bun run build

# 3. Typecheck consumers
cd apps/server && bun run typecheck
```

### Why rebuild?

The server tsconfig points to `packages/api-contract/dist` (built output), not `src/`. This ensures TypeScript resolves the same `zod` instance across all consumers, preventing `unknown` type inference issues.

## Development

```bash
# Build
bun run build

# Type check
bun run typecheck

# Watch mode
bun run dev

# Run usage example
bun run examples/usage.ts
```
