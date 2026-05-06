import {
	authenticatedJsonRequest,
	createIntegrationTestApp,
	jsonRequest,
} from '@/tests/helpers/app-builder'
import { getTestSessionManager, getTestToken } from '@/tests/helpers/session-manager'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { beforeAll, describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Account API', () => {
	const sessionManager = getTestSessionManager()

	beforeAll(async () => {
		await sessionManager.setup()
	})

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

	describe('GET /finance/account/detail', () => {
		it('returns 404 for non-existent account when authenticated', async () => {
			const app = createIntegrationTestApp()
			const token = getTestToken()
			const res = await app.handle(
				authenticatedJsonRequest('GET', '/finance/account/detail?id=999999', token),
			)
			expect(res.status).toBe(404)
		})
	})
})
