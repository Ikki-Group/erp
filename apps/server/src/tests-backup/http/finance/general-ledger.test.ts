import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('General Ledger API', () => {
	describe('GET /finance/general-ledger/entry', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('GET', '/finance/general-ledger/entry?sourceType=test&sourceId=1'),
			)
			expect(res.status).toBe(401)
		})
	})
})
