import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Location API', () => {
	describe('GET /location/master/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/location/master/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('GET /location/master/detail', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/location/master/detail?id=1'))
			expect(res.status).toBe(401)
		})
	})

	describe('POST /location/master/create', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/location/master/create', {
					code: 'LOC-001',
					name: 'Test Location',
					type: 'warehouse',
				}),
			)
			expect(res.status).toBe(401)
		})
	})

	describe('PUT /location/master/update', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('PUT', '/location/master/update', {
					id: 1,
					code: 'LOC-001',
					name: 'Test Location',
					type: 'warehouse',
				}),
			)
			expect(res.status).toBe(401)
		})
	})

	describe('DELETE /location/master/remove', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('DELETE', '/location/master/remove', { id: 1 }))
			expect(res.status).toBe(401)
		})
	})
})
