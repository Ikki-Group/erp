import { testCtx } from '../setup'
import { describe, test, expect } from 'bun:test'

const USER_SUPERADMIN = {
	identifier: 'admin@ikki.com',
	password: 'admin12345',
}

describe('e2e/auth', () => {
	test('login success with valid credentials', async () => {
		const res = await testCtx.client.post('/auth/login', USER_SUPERADMIN)

		const json = await testCtx.client.toJsonResponse(res)
		expect(res.status).toBe(200)
		expect(json.success).toBe(true)
	})

	test('login fails with invalid password', async () => {
		const res = await testCtx.client.post('/auth/login', {
			identifier: USER_SUPERADMIN.identifier,
			password: 'wrongpassword',
		})

		expect(res.status).toBe(401)
	})
})
