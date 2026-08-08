import { auditLogs } from '@/db/schema/audit.ts'

import { db } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

// ─── Types ───

export interface AuditLogEntry {
	userId: number
	userName: string
	locationId?: number | null
	module: string
	entity: string
	entityId: number
	action: 'create' | 'update' | 'delete'
	summary: string
	oldValues?: Record<string, unknown> | null
	newValues?: Record<string, unknown> | null
	metadata?: Record<string, unknown> | null
}

// ─── Audit Log Service ───

/**
 * Non-blocking audit log recorder.
 *
 * Writes to the `audit_logs` table asynchronously. If the insert fails,
 * the error is logged but never thrown — the caller's operation is not affected.
 */
export const auditLog = {
	/**
	 * Record a mutation in the audit log.
	 *
	 * This is fire-and-forget: it does not await completion and will never
	 * throw to the caller. Errors are logged to stderr.
	 */
	record(entry: AuditLogEntry, database: DbContext = db): void {
		void database
			.insert(auditLogs)
			.values({
				userId: entry.userId,
				userName: entry.userName,
				locationId: entry.locationId ?? null,
				module: entry.module,
				entity: entry.entity,
				entityId: entry.entityId,
				action: entry.action,
				summary: entry.summary,
				oldValues: entry.oldValues ?? null,
				newValues: entry.newValues ?? null,
				metadata: entry.metadata ?? null,
			})
			.catch((err) => {
				console.error('[audit-log] Failed to write audit entry:', err)
			})
	},

	/**
	 * Awaitable version — use when you need to guarantee the audit log was written
	 * (e.g. in tests or critical compliance scenarios).
	 */
	async recordAsync(entry: AuditLogEntry, database: DbContext = db): Promise<void> {
		try {
			await database.insert(auditLogs).values({
				userId: entry.userId,
				userName: entry.userName,
				locationId: entry.locationId ?? null,
				module: entry.module,
				entity: entry.entity,
				entityId: entry.entityId,
				action: entry.action,
				summary: entry.summary,
				oldValues: entry.oldValues ?? null,
				newValues: entry.newValues ?? null,
				metadata: entry.metadata ?? null,
			})
		} catch (err) {
			console.error('[audit-log] Failed to write audit entry:', err)
		}
	},
}
