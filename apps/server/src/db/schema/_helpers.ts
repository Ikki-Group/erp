import { pgEnum, timestamp, uuid } from 'drizzle-orm/pg-core'

// ─── Reusable Column Helpers ──────────────────────────────────────────────────

/**
 * Primary key using UUID (v4).
 * Best practice for ERP systems for global scalability and preventing ID guessing.
 */
export const pk = { id: uuid().defaultRandom().primaryKey() } as const

/**
 * Audit metadata columns shared by every domain table.
 *
 * - `createdAt` / `updatedAt` track document lifecycle.
 * - `deletedAt` enforces soft deletes to retain historical ledger integrity.
 * - `createdBy` / `updatedBy` / `deletedBy` store UUIDs referencing users.
 *   Referential integrity for User IDs is bypassed here but enforced logic-side
 *   or via table-level foreignKeys() definitions.
 */
export const metadata = {
  createdAt: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp({ mode: 'date', withTimezone: true }),
  createdBy: uuid().notNull(), // Intentionally soft-linked to avoid cyclic TS imports here
  updatedBy: uuid().notNull(), // Intentionally soft-linked
  deletedBy: uuid(), // Intentionally soft-linked
  syncAt: timestamp({ mode: 'date', withTimezone: true }),
} as const

// ─── Shared Enums ─────────────────────────────────────────────────────────────

export const locationTypeEnum = pgEnum('location_type', ['store', 'warehouse'])

// Enforced strictly: raw (e.g. Beans), semi (e.g. Pre-made sauces), packaging (e.g. Cups)
export const materialTypeEnum = pgEnum('material_type', ['raw', 'semi', 'packaging'])

export const transactionTypeEnum = pgEnum('transaction_type', [
  'purchase',
  'transfer_in',
  'transfer_out',
  'adjustment',
  'sell',
  'production_in',
  'production_out',
])

export const productStatusEnum = pgEnum('product_status', ['active', 'inactive', 'archived'])
