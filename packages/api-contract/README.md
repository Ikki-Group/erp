# @ikki/api-contract

Shared API contract types and validators for Ikki ERP (for future use).

## Structure

- **core/** - Core TypeScript types (pagination, audit, common)
- **validation/** - Zod validators (primitive, common, query)

## Status

**Foundation:** ✅ Complete
- Package structure created
- Core types extracted
- Validation schemas extracted
- Package builds successfully
- Usage example works

**Integration Status:** ⚠️ Deferred
- TypeScript workspace type resolution limitations in Bun workspaces
- Types resolve as `unknown` when imported via workspace dependency
- Requires alternative monorepo setup (Turborepo/Nx) or different approach

## Current Approach

Server and web continue to use their local `lib/validation` and `lib/utils` directories. The api-contract package exists as a reference implementation and can be used in the future if:
1. Migrated to Turborepo or Nx for better monorepo tooling
2. Or used with a different build setup that supports proper type resolution
3. Or converted to a copy-based approach with CI validation

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
