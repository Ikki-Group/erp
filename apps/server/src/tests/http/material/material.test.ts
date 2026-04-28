import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Material API', () => {
	describe('GET /material/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/material/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('GET /material/detail', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/material/detail?id=1'))
			expect(res.status).toBe(401)
		})

		it('returns 422 for invalid ID format', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/material/detail?id=invalid'))
			expect(res.status).toBe(422)
		})
	})

	describe('POST /material/create', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/material/create', {
					code: 'MAT-001',
					name: 'Test Material',
					sku: 'SKU-001',
					type: 'raw',
					description: null,
					categoryId: 1,
					uomId: 1,
					baseUomId: 1,
					locations: [],
				}),
			)
			expect(res.status).toBe(401)
		})

		it('returns 422 for validation error (missing required fields)', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/material/create', {
					code: 'MAT-001',
					categoryId: 1,
					uomId: 1,
					baseUomId: 1,
					locations: [],
					// Missing required 'name', 'sku', 'type'
				}),
			)
			expect(res.status).toBe(422)
		})

		it('returns 422 for invalid type value', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/material/create', {
					code: 'MAT-001',
					name: 'Test Material',
					sku: 'SKU-001',
					type: 'invalid-type', // Invalid enum value
					categoryId: 1,
					uomId: 1,
					baseUomId: 1,
					locations: [],
				}),
			)
			expect(res.status).toBe(422)
		})
	})
})
