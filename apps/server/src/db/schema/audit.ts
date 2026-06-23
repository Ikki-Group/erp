import { pgEnum, pgTable, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

import { pk } from './_helpers'

export const auditActionEnum = pgEnum('audit_action', [
	'CREATE',
	'UPDATE',
	'DELETE',
	'LOGIN',
	'LOGOUT',
	'OTHER',
])

/**
 * Audit Log Table
 *
 * Tracks all user actions for compliance and security auditing.
 */
export const auditLogsTable = pgTable(
	'audit_logs',
	{
		...pk,
		/** User who performed the action */
		userId: integer('user_id').notNull(),
		/** Action type (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.) */
		action: auditActionEnum('action').notNull(),
		/** Entity type (table name or resource name) */
		entityType: text('entity_type').notNull(),
		/** Entity ID (record ID that was affected) */
		entityId: text('entity_id'),
		/** Description of the action */
		description: text('description').notNull(),
		/** Old value before change (for UPDATE actions) */
		oldValue: jsonb('old_value'),
		/** New value after change (for CREATE/UPDATE actions) */
		newValue: jsonb('new_value'),
		/** IP address of the user */
		ipAddress: text('ip_address'),
		/** User agent string */
		userAgent: text('user_agent'),
		/** Timestamp when the action occurred */
		actionAt: timestamp('action_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index('audit_logs_user_idx').on(t.userId),
		index('audit_logs_action_idx').on(t.action),
		index('audit_logs_entity_idx').on(t.entityType, t.entityId),
		index('audit_logs_action_at_idx').on(t.actionAt),
	],
)
