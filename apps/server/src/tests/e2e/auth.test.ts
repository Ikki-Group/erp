import { testCtx } from '../setup'
import { describe, test, expect } from 'bun:test'

describe('e2e/auth', () => {
	test('login success with valid credentials', async () => {
		const res = await testCtx.client.post('/auth/login', {
			identifier: 'admin@ikki.com',
			password: 'admin12345',
		})

		const json = await testCtx.client.toJsonResponse(res)
		expect(res.status).toBe(200)
		expect(json.success).toBe(true)
	})

	test('login fails with invalid password', async () => {
		const res = await testCtx.client.post('/auth/login', {
			identifier: 'admin@ikki.com',
			password: 'wrongpassword',
		})

		expect(res.status).toBe(401)
	})
})
