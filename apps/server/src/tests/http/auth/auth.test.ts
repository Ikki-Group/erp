import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Auth API', () => {
	describe('POST /auth/login', () => {
		it('returns 422 for invalid password length', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/auth/login', {
					identifier: 'test@example.com',
					password: '123', // Too short
				}),
			)
			expect(res.status).toBe(422)
		})

		it('returns 401 for invalid credentials', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/auth/login', {
					identifier: 'nonexistent@example.com',
					password: 'ValidPassword123!',
				}),
			)
			expect(res.status).toBe(401)
		})
	})

	describe('GET /auth/me', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/auth/me'))
			expect(res.status).toBe(401)
		})

		it.skip('returns 200 with user data when authenticated', async () => {
			// Skip until database session setup is resolved
			// Mock tokens don't work with real session verification
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('GET', '/auth/me', undefined, {
					Authorization: 'Bearer mock-valid-token',
				}),
			)
			expect(res.status).toBe(200)
		})
	})
})
