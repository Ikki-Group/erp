import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Product Category API', () => {
	describe('GET /product/category/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/product/category/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('POST /product/category/create', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/product/category/create', {
					code: 'PCAT-001',
					name: 'Test Product Category',
					description: null,
					parentId: null,
				}),
			)
			expect(res.status).toBe(401)
		})

		it('returns 422 for missing required name field', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/product/category/create', {
					code: 'PCAT-001',
					parentId: null,
					// Missing required 'name' field
				}),
			)
			expect(res.status).toBe(422)
		})
	})
})
