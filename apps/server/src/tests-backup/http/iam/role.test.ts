import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Role API', () => {
	describe('GET /iam/role/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/iam/role/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('GET /iam/role/detail', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/iam/role/detail?id=1'))
			expect(res.status).toBe(401)
		})
	})

	describe('POST /iam/role/create', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/iam/role/create', {
					code: 'TEST_ROLE',
					name: 'Test Role',
					description: null,
					permissions: [],
					isSystem: false,
				}),
			)
			expect(res.status).toBe(401)
		})
	})
})
