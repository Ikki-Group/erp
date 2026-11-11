import { serial, timestamp, integer, boolean } from 'drizzle-orm/pg-core'

// ─── Primary Key ───

export const pk = {
	id: serial('id').primaryKey(),
}

// ─── Audit Columns ───

export const auditBasicColumns = {
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	createdBy: integer('created_by'),
	updatedBy: integer('updated_by'),
}

export const auditFullColumns = {
	...auditBasicColumns,
}

// ─── Soft Delete ───

export const softDeleteColumns = {
	isActive: boolean('is_active').notNull().default(true),
}
