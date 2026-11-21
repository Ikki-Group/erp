import { auditLogs } from '@/db/schema/audit.ts'

import { auditPort } from '@/infra/audit/audit.drizzle.ts'
import { db, eq, uow } from '@/infra/database/index.ts'

import { describe, expect, test } from 'bun:test'

describe('audit port', () => {
	test('rolls back an audit row when the surrounding unit of work throws', async () => {
		const summary = `__t005_${crypto.randomUUID()}`
		let thrown: unknown

		try {
			await uow.run(async (tx) => {
				await auditPort.record(
					{
						actorId: 1,
						actorName: 'T-005 test actor',
						module: 'test',
						entity: 'audit-check',
						entityId: 1,
						action: 'create',
						summary,
					},
					tx,
				)
				throw new Error('force audit rollback')
			})
		} catch (error) {
			thrown = error
		}

		expect(thrown).toBeInstanceOf(Error)
		expect((thrown as Error).message).toBe('force audit rollback')

		const rows = await db
			.select({ id: auditLogs.id })
			.from(auditLogs)
			.where(eq(auditLogs.summary, summary))

		expect(rows).toHaveLength(0)
	})

	test('rejects an empty actor name', async () => {
		let thrown: unknown
		try {
			await uow.run(async (tx) =>
				auditPort.record(
					{
						actorId: 1,
						actorName: '',
						module: 'test',
						entity: 'audit-check',
						entityId: 1,
						action: 'create',
						summary: 'invalid actor',
					},
					tx,
				),
			)
		} catch (error) {
			thrown = error
		}

		expect(thrown).toBeInstanceOf(Error)
		expect((thrown as Error).message).toBe('audit actorName is required')
	})
})
