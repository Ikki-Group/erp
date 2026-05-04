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
