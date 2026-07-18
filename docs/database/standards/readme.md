# Database Design Standards

Conventions and rules applied across all tables in the Ikki ERP schema.

---

## Files

| File | Topic |
|------|-------|
| [naming.md](./naming.md) | Naming conventions for tables, columns, indexes, enums, files |
| [columns.md](./columns.md) | PK, audit, timestamps, booleans, numerics, JSONB patterns |
| [constraints.md](./constraints.md) | FK strategy, check constraints, soft-delete, enums |
| [indexes.md](./indexes.md) | Index strategy, unique indexes, partial indexes |

## Quick Rules

- PostgreSQL + Drizzle ORM. Schema at `apps/server/src/db/schema/`.
- Serial integer PK everywhere. UUID reserved for future high-growth only.
- `numeric(18,2)` for money. `numeric(18,6)` for quantities.
- Every FK declares `onDelete` explicitly.
- Every FK column gets an index.
- Booleans are always `notNull()` with a default.
- No raw SQL in schema — use Drizzle builder functions only.
- Migrations: `bun run db:generate` → `bun run db:migrate`.

## Anti-Patterns

| Don't | Do |
|-------|-----|
| Nullable boolean | `notNull()` with default |
| Float for money | `numeric(18, 2)` |
| Missing FK index | `index()` on every FK |
| Implicit onDelete | Always declare explicitly |
| Raw SQL in schema | Drizzle builder (`eq`, `gte`, `and`) |
| Composite PK | Serial `id` + unique index |
| Duplicate enum across files | Promote to `_enums.ts` if cross-domain |
