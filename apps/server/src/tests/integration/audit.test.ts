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

	test('list filters by module', async () => {
		const cookie = await loginAs(SEED_USERS.owner.username)
		const response = await GET('/audit/list', {
			cookie,
			query: { module: 'iam', limit: '100' },
		})
		expect(response.status).toBe(200)
		const body = await json(response)
		// Every returned row must belong to the requested module (empty is fine).
		for (const row of body.data as Array<{ module: string }>) {
			expect(row.module).toBe('iam')
		}
	})

	test('list date range excludes entries outside the window', async () => {
		const cookie = await loginAs(SEED_USERS.owner.username)
		// A window entirely in the future can contain no past audit entries.
		const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
		const laterFuture = new Date(future.getTime() + 24 * 60 * 60 * 1000)
		const response = await GET('/audit/list', {
			cookie,
			query: {
				dateFrom: future.toISOString(),
				dateTo: laterFuture.toISOString(),
				limit: '100',
			},
		})
		expect(response.status).toBe(200)
		const body = await json(response)
		expect(body.data).toBeInstanceOf(Array)
		expect(body.data.length).toBe(0)
		expect(body.meta.total).toBe(0)
	})
})
