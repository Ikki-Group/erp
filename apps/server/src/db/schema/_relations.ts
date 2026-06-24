/**
 * Drizzle Relations Definitions
 *
 * TODO: Implement relations after all schema tables are exported in index.ts
 *
 * Relations are optional and only provide query convenience for relational queries.
 * They don't affect the database schema or migrations.
 *
 * Currently most tables are NOT exported in index.ts (commented out).
 * Uncomment exports in index.ts first, then define relations here.
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
 * Pending exports to enable relations:
 * - audit, company, customer, employee
 * - finance, finance_payment, hr
 * - inventory, inventory_transfer
 * - material, moka, payment_methods, payment_provider
 * - product, production, purchasing, recipe
 * - sales, sales-type, tax, uom, location_payment_method
 */

// Empty stub - relations are optional and will be implemented when needed
export const relations = {}
