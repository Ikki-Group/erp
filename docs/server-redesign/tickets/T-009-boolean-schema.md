# T-009: Schema integer→boolean + regenerate migrations

**Tracker row:** P0.9
**Depends on:** —
**Type:** schema

## Goal
Every `is_*` boolean-intent column across `db/schema/*.ts` is a native Postgres `boolean`; migrations are regenerated and applied.

## Read first
- [13-migration-overview.md](../13-migration-overview.md) §Schema
- ADR-0008

## Build
1. Update `db/schema/_helpers.ts` `softDeleteColumns.isActive` → `boolean('is_active').notNull().default(true)`.
2. Grep every schema file for `integer('is_` and boolean-intent `.default(1)`/`.default(0)`; convert each to `boolean(...)` (see the column list in spec 13). **Leave enum `status` columns alone** — they are not booleans.
3. `bun run db:generate` then `bun run db:migrate` (from `apps/server`; ensure env points at the dev/test DB per AGENTS.md guard).

## Definition of done
- No `integer('is_` remains for a boolean field (grep is clean).
- Drizzle types for these columns are `boolean`.
- Migration applies cleanly against a fresh DB.
- `bun run verify` green.

## Notes / gotchas
Pre-production: no data to preserve, so regenerating migrations from scratch is fine. This is a breaking schema change by design. DTO/repo boolean conversions (`? 1 : 0`, `=== 1`) disappear in each module ticket — this ticket only fixes the schema + `_helpers`.
