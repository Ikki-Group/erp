# CLAUDE.md - Ikki ERP Server

Ikki ERP is a TypeScript + Bun monorepo with server (Elysia + Drizzle) and web (React + Vite) apps.

## Quick Commands

```bash
# Core
bun run dev:server      # Start dev server
bun run dev:web         # Start Vite dev server
bun run build           # Production build
bun run verify          # Lint + typecheck + tests

# Server
cd apps/server
bun run db:generate     # Generate migration from schema
bun run db:migrate      # Apply migrations
bun run db:studio       # Drizzle Studio
bun test                # Run tests
```

## Code Style

- **ES Modules**: import/export (not CommonJS)
- **IDs**: Serial integers (not UUIDs)
- **Naming**: camelCase functions, PascalCase classes, UPPERCASE constants
- **Databases**: Drizzle ORM with serial integer PKs
- **Validation**: Zod schemas with spread-shape pattern (not `.extend()`)
- **Error Handling**: Throw custom errors (NotFoundError, ConflictError, etc.)
- **Caching**: Use bento.namespace() with TTL + invalidation on writes
- **Audit**: All writes must include createdBy/updatedBy

## Module Structure

Each module follows this pattern:
```
src/modules/{name}/
├── dto/          # Zod validation schemas
├── repo/         # Database queries (Drizzle)
├── service/      # Business logic with handleX methods
├── router/       # Elysia routes (inline async functions)
└── index.ts      # Public API exports
```

Service methods are public (handleCreate, handleDetail, etc.) and private helpers have no prefix.

## Database Patterns

- **Queries**: Use `inArray()` for batch (not loops), `paginate()` for lists with parallel count
- **Mutations**: Single transaction per operation, batch operations via `inArray()`
- **Relationships**: RelationMap for in-memory joins (prevent N+1)
- **Conflict Checking**: Use `checkConflict()` utility before CREATE/UPDATE

## Testing & Verification

- **Unit Tests**: Mock repo, test service logic only
- **Integration Tests**: Full route + real service
- **Before PR**: `bun run verify` (lint + typecheck + tests + no circular deps)
- **Verification wins**: Always include tests, screenshots, or expected outputs

## Gotchas

- Context window fills fast. Use `/clear` between unrelated tasks
- `.extend()` on Zod breaks type inference. Use spread-shape instead
- Loops with N DB calls → use batch operations with `inArray()`
- Missing audit columns (createdBy/updatedBy) causes tracking issues
- Forget cache invalidation on writes → stale data

## External Resources

- Architecture patterns: @docs/ARCHITECTURE.md
- Code patterns & snippets: @docs/CODE_PATTERNS.md
- Module review checklist: @docs/MODULE_CHECKLIST.md
- Full best practices guide: https://code.claude.com/docs/en/best-practices

## Layer Dependencies

Layer 3 (Aggregators) → Layer 2 (Operations) → Layer 1 (Master Data) → Layer 0 (Core)

No circular imports. Verify with `bun run check-deps`.

## Quick Help

- **"Build a feature"** → Start with `/explore` to understand patterns, then use feature-development skill
- **"Review code"** → Use code-review skill
- **"Optimize performance"** → Run optimization skill for analysis
- **"New to project"** → Use architecture-explorer subagent
