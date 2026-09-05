import { auditLogs } from '@/db/schema/audit.ts'

import type { AuditPort } from '@/shared/audit/audit.port.ts'

export const auditPort: AuditPort = {
	async record(entry, tx) {
		if (!entry.actorName) throw new Error('audit actorName is required')

		await tx.insert(auditLogs).values({
			userId: entry.actorId,
			userName: entry.actorName,
			locationId: entry.locationId ?? null,
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
