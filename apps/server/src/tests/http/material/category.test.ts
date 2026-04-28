import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Material Category API', () => {
	describe('GET /material/category/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/material/category/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('POST /material/category/create', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/material/category/create', {
					code: 'CAT-001',
					name: 'Test Category',
					description: null,
					parentId: null,
				}),
			)
			expect(res.status).toBe(401)
		})

		it('returns 422 for missing required name field', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/material/category/create', {
					code: 'CAT-001',
					parentId: null,
					// Missing required 'name' field
				}),
			)
			expect(res.status).toBe(422)
		})
	})

	describe('GET /material/category/detail', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/material/category/detail?id=999999'))
			expect(res.status).toBe(401)
		})
	})
})
