import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Supplier API', () => {
	describe('GET /supplier/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/supplier/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('GET /supplier/detail', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/supplier/detail?id=1'))
			expect(res.status).toBe(401)
		})
	})

	describe('POST /supplier/create', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/supplier/create', {
					code: 'SUP-001',
					name: 'Test Supplier',
					address: null,
					phone: null,
					email: null,
					contactPerson: null,
				}),
			)
			expect(res.status).toBe(401)
		})
	})

	describe('PUT /supplier/update', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('PUT', '/supplier/update', {
					id: 1,
					code: 'SUP-001',
					name: 'Test Supplier',
				}),
			)
			expect(res.status).toBe(401)
		})
	})

	describe('DELETE /supplier/remove', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('DELETE', '/supplier/remove', { id: 1 }))
			expect(res.status).toBe(401)
		})
	})
})
