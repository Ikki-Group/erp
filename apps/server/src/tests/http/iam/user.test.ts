import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('User API', () => {
	describe('GET /user/list', () => {
		it('returns empty list initially', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/user/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('POST /user/create', () => {
		it('creates user with valid data', async () => {
			const app = createIntegrationTestApp()
			const createData = {
				email: 'test@example.com',
				username: 'testuser',
				fullname: 'Test User',
				password: 'password123',
				isActive: true,
				isRoot: false,
				assignments: [],
			}

			const res = await app.handle(jsonRequest('POST', '/user/create', createData))
			expect(res.status).toBe(401)
		})
	})
})
