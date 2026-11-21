import { locations } from '@/db/schema/core.ts'

import { db, eq, uow } from '@/infra/database/index.ts'

import { describe, expect, test } from 'bun:test'

describe('unit of work', () => {
	test('rolls back earlier writes when a later write fails', async () => {
		const code = `__t002_${crypto.randomUUID()}`
		let thrown: unknown

		try {
			await uow.run(async (tx) => {
				await tx.insert(locations).values({
					code,
					name: 'T-002 first write',
					type: 'store',
				})
				await tx.insert(locations).values({
					code,
					name: 'T-002 second write',
					type: 'store',
				})
			})
		} catch (error) {
			thrown = error
		}

		expect(thrown).toBeDefined()

		const rows = await db
			.select({ id: locations.id })
			.from(locations)
			.where(eq(locations.code, code))

		expect(rows).toHaveLength(0)
	})
})
