import { pgTable, varchar, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core'

import { pk } from './_helpers.ts'
import { locations } from './core.ts'
import { users } from './iam.ts'

// ─── Audit Logs ───

export const auditLogs = pgTable(
	'audit_logs',
	{
		...pk,
		timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		userName: varchar('user_name', { length: 255 }).notNull(),
		locationId: integer('location_id').references(() => locations.id, { onDelete: 'set null' }),
		module: varchar('module', { length: 50 }).notNull(),
		entity: varchar('entity', { length: 50 }).notNull(),
		entityId: integer('entity_id').notNull(),
		action: varchar('action', { length: 20 }).notNull(),
		summary: varchar('summary', { length: 500 }).notNull(),
		oldValues: jsonb('old_values'),
		newValues: jsonb('new_values'),
		metadata: jsonb('metadata'),
	},
	(t) => [
		index('audit_logs_timestamp_idx').on(t.timestamp),
		index('audit_logs_entity_entity_id_idx').on(t.entity, t.entityId),
		index('audit_logs_user_id_timestamp_idx').on(t.userId, t.timestamp),
		index('audit_logs_module_timestamp_idx').on(t.module, t.timestamp),
	],
)
