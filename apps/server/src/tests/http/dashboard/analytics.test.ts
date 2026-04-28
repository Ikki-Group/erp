import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Dashboard Analytics API', () => {
	describe('POST /dashboard/analytics/pnl', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/dashboard/analytics/pnl', {
					startDate: '2024-01-01',
					endDate: '2024-12-31',
				}),
			)
			expect(res.status).toBe(401)
		})
	})
})
