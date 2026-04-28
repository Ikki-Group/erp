import { describe, expect, it } from 'bun/test'

import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'

setupIntegrationTests()

describe('Purchase Order API', () => {
	describe('GET /purchasing/purchase-order/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/purchasing/purchase-order/list'))
			expect(res.status).toBe(401)
		})
	})
})
