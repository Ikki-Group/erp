import type { Tx } from '@/infra/database/client.ts'
import type { Actor } from '@/shared/auth/actor.ts'

export interface AuditEntry {
	actorId: number
	actorName: string
	locationId?: number | null
	module: string
	entity: string
	entityId: number
	action: string
	summary: string
	oldValues?: Record<string, unknown> | null
	newValues?: Record<string, unknown> | null
}

export interface AuditPort {
	/** Writes the audit entry within the given transaction. Awaited and throws on failure. */
	record(entry: AuditEntry, tx: Tx): Promise<void>
}

export type AuditEntryInput = Omit<AuditEntry, 'actorId' | 'actorName' | 'locationId'>

/** Build an audit entry from the authenticated domain actor. */
export function auditEntryOf(actor: Actor, entry: AuditEntryInput): AuditEntry {
	const actorName = actor.name.trim()
	if (!actorName) throw new Error('Audit actor name is required')
	return {
		...entry,
		actorId: actor.id,
		actorName,
		locationId: actor.locationId,
	}
}
