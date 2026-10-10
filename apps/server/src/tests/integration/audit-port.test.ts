import { auditLogs } from '@/db/schema/audit.ts'

import { audit } from '@/infra/audit.ts'
import { db, eq, uow } from '@/infra/database/index.ts'

import { describe, expect, test } from 'bun:test'

const actor = { id: 1, name: 'Audit test actor', locationId: null }
const entry = { module: 'test', entity: 'audit-check', entityId: 1, action: 'create' }

describe('audit log', () => {
	test('rolls back the audit row with its transaction', async () => {
		const summary = `__audit_${crypto.randomUUID()}`
		const run = uow.run(async (tx) => {
			await audit.record(tx, actor, { ...entry, summary })
			throw new Error('force rollback')
		})
		expect(run).rejects.toThrow('force rollback')
		await run.catch(() => {})
		const rows = await db.select().from(auditLogs).where(eq(auditLogs.summary, summary))
		expect(rows).toHaveLength(0)
	})

	test('rejects a blank actor name', async () => {
		const run = uow.run((tx) =>
			audit.record(tx, { ...actor, name: ' ' }, { ...entry, summary: 'x' }),
		)
		expect(run).rejects.toThrow('Audit actor name is required')
		await run.catch(() => {})
	})
})
