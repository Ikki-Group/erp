import { integer, pgEnum, serial, timestamp, uuid } from 'drizzle-orm/pg-core'

// ─── Reusable Column Helpers ──────────────────────────────────────────────────

/**
 * Primary key using auto-incrementing integer (serial).
 * Default for most domain tables — lightweight and fast for joins.
 */
export const pk = {
  id: serial().primaryKey(),
} as const

/**
 * Primary key using UUIDv4.
 * Use this for tables that may grow very large, need globally unique IDs,
 * or require distributed inserts (e.g., high-volume transactional data).
 */
export const pkUuid = {
  id: uuid().primaryKey().defaultRandom(),
} as const

/**
 * Audit metadata columns shared by every domain table.
 *
 * - `createdAt` / `updatedAt` are managed by the service layer, not DB triggers,
 *   so they are NOT auto-updated — this keeps the behavior predictable and testable.
 * - `createdBy` / `updatedBy` store integer IDs referencing users.
 *   We intentionally do NOT declare FK here to avoid circular imports.
 *   Referential integrity is enforced at the application layer.
 * - `syncAt` is nullable; only used for data synchronization tracking.
 */
export const metadata = {
  createdAt: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
  createdBy: integer().notNull(),
  updatedBy: integer().notNull(),
  syncAt: timestamp({ mode: 'date', withTimezone: true }),
} as const

// ─── Shared Enums ─────────────────────────────────────────────────────────────

export const locationTypeEnum = pgEnum('location_type', ['store', 'warehouse'])

export const materialTypeEnum = pgEnum('material_type', ['raw', 'semi'])

export const transactionTypeEnum = pgEnum('transaction_type', [
  'purchase',
  'transfer_in',
  'transfer_out',
  'adjustment',
  'sell',
])
