import { timestamp, uuid } from 'drizzle-orm/pg-core'

import { stampCreate, stampUpdate } from './metadata'

/**
 * Standard Primary Key column using UUID v4.
 *
 * All domain tables MUST use this as their primary key for scalability
 * and to prevent ID enumeration attacks common in ERP systems.
 */
export const pk = {
  id: uuid('id').primaryKey().defaultRandom(),
} as const

/**
 * Audit and Soft-Delete metadata columns.
 *
 * Follows the Enterprise Lifecycle Management pattern:
 * - `createdAt` & `updatedAt`: Automatic lifecycle tracking.
 * - `deletedAt`: Enables soft-deletion to preserve historical ledger integrity.
 * - `createdBy`, `updatedBy`, `deletedBy`: Reference Actor ID (UUID).
 * - `syncAt`: tracking external synchronization (e.g. Moka).
 *
 * Actor IDs (createdBy, etc.) are UUIDs matching IAM user IDs.
 */
export const auditColumns = {
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),

  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  deletedBy: uuid('deleted_by'),

  syncAt: timestamp('sync_at', { mode: 'date', withTimezone: true }),
} as const

/**
 * Reusable stamping utility for Drizzle `insert` and `update` operations.
 */
export const stamps = {
  create: stampCreate,
  update: stampUpdate,
}
