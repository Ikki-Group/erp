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
	})

	describe('POST /employee/create', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/employee/create', {
					code: 'EMP-001',
					name: 'Test Employee',
					address: null,
					phone: null,
					email: null,
					position: null,
				}),
			)
			expect(res.status).toBe(401)
		})
	})

	describe('PUT /employee/update', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('PUT', '/employee/update', {
					id: 1,
					code: 'EMP-001',
					name: 'Test Employee',
				}),
			)
			expect(res.status).toBe(401)
		})
	})

	describe('DELETE /employee/remove', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('DELETE', '/employee/remove', { id: 1 }))
			expect(res.status).toBe(401)
		})
	})
})
