import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Moka Integration API', () => {
	describe('GET /moka/scrap/history', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/moka/scrap/history'))
			expect(res.status).toBe(401)
		})
	})

	describe('POST /moka/scrap/trigger', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/moka/scrap/trigger', {
					locationId: 1,
					type: 'sales',
				}),
			)
			expect(res.status).toBe(401)
		})

		it('returns 422 for missing required fields', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/moka/scrap/trigger', {
					// Missing locationId, type
				}),
			)
			expect(res.status).toBe(422)
		})
	})
})
