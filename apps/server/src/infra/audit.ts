import { auditLogs } from '@/db/schema/audit.ts'

import type { Tx } from '@/infra/database/index.ts'
import type { Actor } from '@/shared/auth/actor.ts'

export interface AuditEntry {
	module: string
	entity: string
	entityId: number
	/** CRUD verb or a domain verb (`complete`, `void`, `ship`, ...). */
	action: string
	summary: string
	oldValues?: Record<string, unknown> | null
	newValues?: Record<string, unknown> | null
	/** Defaults to the actor's active location. */
	locationId?: number | null
}

/**
 * Append-only audit trail (ADR-0005). Always written inside the mutation's
 * transaction so an audit row can never be lost or orphaned.
 */
export const audit = {
	async record(tx: Tx, actor: Actor, entry: AuditEntry): Promise<void> {
		const actorName = actor.name.trim()
		if (!actorName) throw new Error('Audit actor name is required')
		await tx.insert(auditLogs).values({
			userId: actor.id,
			userName: actorName,
			locationId: entry.locationId === undefined ? actor.locationId : entry.locationId,
			module: entry.module,
			entity: entry.entity,
			entityId: entry.entityId,
			action: entry.action,
			summary: entry.summary,
			oldValues: entry.oldValues ?? null,
			newValues: entry.newValues ?? null,
			metadata: null,
		})
	},
}

export type AuditLog = typeof audit
