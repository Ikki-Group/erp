import { locations } from '@/db/schema/core.ts'
import { db, eq } from '@/infra/database/index.ts'
import type { Tx } from '@/infra/database/index.ts'
import { describe, expect, test } from 'bun:test'

describe('database client transactions', () => {
	test('rolls back inserted rows when the transaction callback throws', async () => {
		const code = `__t001_${crypto.randomUUID()}`

		let thrown: unknown
		try {
			await db.transaction(async (tx) => {
				const transactionContext: Tx = tx
				expect(transactionContext).toBe(tx)
				await tx.insert(locations).values({
					code,
					name: 'T-001 rollback check',
					type: 'store',
				})
				throw new Error('force rollback')
			})
		} catch (error) {
			thrown = error
		}

		expect(thrown).toBeInstanceOf(Error)
		expect((thrown as Error).message).toBe('force rollback')

		const rows = await db
			.select({ id: locations.id })
			.from(locations)
			.where(eq(locations.code, code))

		expect(rows).toHaveLength(0)
	})
})
