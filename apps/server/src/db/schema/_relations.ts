/**
 * Drizzle Relations Definitions
 *
 * TODO: Implement relations if/when needed for Drizzle Studio browsing or
 * ad-hoc scripts.
 *
 * Relations are optional and only provide query convenience for relational
 * queries (`db.query.x.findMany({ with: ... })`). They don't affect the
 * database schema or migrations.
 *
 * ⚠ Do NOT use `db.query...with()` in repo/service hot paths. Every relational
 * query executes a live join against Postgres — it bypasses the entire cache
 * layer (see `infra/cache/`). The codebase deliberately uses manual
 * `.select()` + `RelationMap` (see `shared/utils/relation-map.ts`) instead,
 * so each piece of a composed read can be cached and invalidated
 * independently. Keep using that pattern; only reach for `relations()` here
 * for tooling/scripts that don't go through the cache anyway.
 *
 * Drizzle Relations API (v1.0.0-rc.4+):
 * ```typescript
 * import { relations } from 'drizzle-orm'
 *
 * export const usersRelations = relations(usersTable, ({ one, many }) => ({
 *   defaultLocation: one(locationsTable, {
 *     fields: [usersTable.defaultLocationId],
 *     references: [locationsTable.id],
 *   }),
 *   sessions: many(sessionsTable),
 * }))
 * ```
 *
 * Pattern:
 * - Parent table: many(childTable)
 * - Child table: one(parentTable, { fields, references })
 *
 * All tables are exported via `db/schema/index.ts` (see that file's grouping
 * comment for the folder-per-domain layout) — nothing pending here anymore.
 */

// Empty stub - relations are optional and will be implemented when needed
export const relations = {}
