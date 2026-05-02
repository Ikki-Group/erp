import { pgEnum, pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

export const auditActionEnum = pgEnum('audit_action', ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'OTHER'])

/**
 * Audit Log Table
 *
 * Tracks all user actions for compliance and security auditing.
 */
export const auditLogsTable = pgTable('audit_logs', {
	...pk,
	/** User who performed the action */
	userId: integer().notNull(),
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
	actionAt: timestamp('action_at').defaultNow().notNull(),
	...auditColumns,
})
