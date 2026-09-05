import type { Tx } from '@/infra/database/client.ts'

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
