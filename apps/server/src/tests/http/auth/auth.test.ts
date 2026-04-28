import {
	createIntegrationTestAppWithMockAuth,
	jsonRequest,
	authenticatedJsonRequest,
} from '@/tests/helpers/app-builder'
import { getTestSessionManager, getTestToken } from '@/tests/helpers/session-manager'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Auth API', () => {
	const sessionManager = getTestSessionManager()

	describe('POST /auth/login', () => {
		it('returns 422 for invalid password length', async () => {
			const app = createIntegrationTestAppWithMockAuth()
			const res = await app.handle(
				jsonRequest('POST', '/auth/login', {
					identifier: 'test@example.com',
					password: '123', // Too short
				}),
			)
			expect(res.status).toBe(422)
		})

		it('returns 401 for invalid credentials', async () => {
			const app = createIntegrationTestAppWithMockAuth()
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
			const app = createIntegrationTestAppWithMockAuth()
			const res = await app.handle(jsonRequest('GET', '/auth/me'))
			expect(res.status).toBe(401)
		})

		it('returns 200 with user data when authenticated', async () => {
			sessionManager.setup()
			const app = createIntegrationTestAppWithMockAuth()
			const token = getTestToken()
			const res = await app.handle(authenticatedJsonRequest('GET', '/auth/me', token))
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body).toHaveProperty('id')
			expect(body).toHaveProperty('email')
		})
	})
})
