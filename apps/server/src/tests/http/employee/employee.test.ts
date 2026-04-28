import {
	authenticatedJsonRequest,
	createIntegrationTestApp,
	jsonRequest,
} from '@/tests/helpers/app-builder'
import { getTestSessionManager, getTestToken } from '@/tests/helpers/session-manager'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { beforeAll, describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Employee API', () => {
	const sessionManager = getTestSessionManager()

	beforeAll(async () => {
		await sessionManager.setup()
	})

	describe('GET /employee/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/employee/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('GET /employee/detail', () => {
		it('returns 404 for non-existent employee when authenticated', async () => {
			const app = createIntegrationTestApp()
			const token = getTestToken()
			const res = await app.handle(
				authenticatedJsonRequest('GET', '/employee/detail?id=999999', token),
			)
			expect(res.status).toBe(404)
		})
	})
})
