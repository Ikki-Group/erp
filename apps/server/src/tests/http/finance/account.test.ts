import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Account API', () => {
	describe('GET /finance/account/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/finance/account/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('POST /finance/account/create', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/finance/account/create', {
					code: 'ACC-001',
					name: 'Test Account',
					type: 'ASSET',
				}),
			)
			expect(res.status).toBe(401)
		})

		it('returns 422 for missing required fields', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/finance/account/create', {
					code: 'ACC-001',
					// Missing name, type
				}),
			)
			expect(res.status).toBe(422)
		})

		it('returns 422 for invalid type enum value', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/finance/account/create', {
					code: 'ACC-001',
					name: 'Test Account',
					type: 'INVALID', // Not in enum: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
				}),
			)
			expect(res.status).toBe(422)
		})
	})
})
