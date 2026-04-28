import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Employee API', () => {
	describe('GET /employee/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/employee/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('GET /employee/detail', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/employee/detail?id=1'))
			expect(res.status).toBe(401)
		})

		it('returns 422 for invalid ID format', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/employee/detail?id=invalid'))
			expect(res.status).toBe(422)
		})
	})
})
