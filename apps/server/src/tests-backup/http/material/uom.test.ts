import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('UOM API', () => {
	describe('GET /material/uom/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/material/uom/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('POST /material/uom/create', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/material/uom/create', {
					code: 'UOM-001',
					name: 'Test UOM',
					symbol: 'kg',
					description: null,
				}),
			)
			expect(res.status).toBe(401)
		})
	})
})
