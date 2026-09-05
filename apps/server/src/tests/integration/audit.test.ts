import { loginAs } from '../helpers/auth.ts'
import { GET, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { describe, expect, test } from 'bun:test'

describe('audit', () => {
	test('owner can list audit entries', async () => {
		const response = await GET('/audit/list', {
			cookie: await loginAs(SEED_USERS.owner.username),
		})

		expect(response.status).toBe(200)
		const body = await json(response)
		expect(body.success).toBe(true)
		expect(body.data).toBeInstanceOf(Array)
		expect(body.meta).toMatchObject({ page: 1, limit: 20 })
	})

	test('cashier cannot list audit entries', async () => {
		const response = await GET('/audit/list', {
			cookie: await loginAs(SEED_USERS.cashier.username),
		})

		expect(response.status).toBe(403)
		expect(await json(response)).toMatchObject({
			success: false,
			error: { code: 'PERMISSION_DENIED' },
		})
	})
})
