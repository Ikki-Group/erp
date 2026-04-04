import { integer, serial, timestamp } from 'drizzle-orm/pg-core'

import { stampCreate, stampUpdate } from './metadata'

/**
 * Standard Primary Key column using Serial Integer.
 *
 * All domain tables use this for storage efficiency by default.
 * UUIDs are reserved for extremely high-growth data only.
 */
export const pk = { id: serial('id').primaryKey() } as const

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

  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by').notNull(),
  deletedBy: integer('deleted_by'),

  syncAt: timestamp('sync_at', { mode: 'date', withTimezone: true }),
} as const

/**
 * Reusable stamping utility for Drizzle `insert` and `update` operations.
 */
export const stamps = { create: stampCreate, update: stampUpdate }
