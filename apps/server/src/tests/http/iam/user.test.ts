import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('User API', () => {
	describe('GET /iam/user/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/iam/user/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('POST /iam/user/create', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const createData = {
				email: 'test@example.com',
				username: 'testuser',
				fullname: 'Test User',
				password: 'password123',
				pinCode: '123456',
				defaultLocationId: null,
				isActive: true,
				isRoot: false,
				assignments: [],
			}

			const res = await app.handle(jsonRequest('POST', '/iam/user/create', createData))
			expect(res.status).toBe(401)
		})
	})
})
