import { integer, serial, timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * Standard Primary Key column using Serial Integer.
 *
 * All domain tables use this for storage efficiency by default.
 * UUIDs are reserved for extremely high-growth data only.
 */
export const pk = { id: serial('id').primaryKey() } as const
export const pkUUID = { id: uuid('id').primaryKey() } as const

export const timestampColumns = {
	createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
} as const

export const actorColumns = {
	createdBy: integer('created_by').notNull(),
	updatedBy: integer('updated_by').notNull(),
} as const

export const softDeleteColumns = {
	deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
	deletedBy: integer('deleted_by'),
} as const

export const syncMetaColumns = {
	syncAt: timestamp('sync_at', { mode: 'date', withTimezone: true }),
} as const

export const auditBasicColumns = {
	...timestampColumns,
	...actorColumns,
} as const

export const auditFullColumns = {
	...auditBasicColumns,
	...softDeleteColumns,
} as const
