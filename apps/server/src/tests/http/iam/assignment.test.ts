import { createIntegrationTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Assignment API', () => {
	describe('GET /iam/assignment/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/iam/assignment/list'))
			expect(res.status).toBe(401)
		})
	})

	describe('POST /iam/assignment/assign', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('POST', '/iam/assignment/assign', {
					userId: 1,
					roleId: 1,
					locationId: 1,
				}),
			)
			expect(res.status).toBe(401)
		})
	})

	describe('DELETE /iam/assignment/remove', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(
				jsonRequest('DELETE', '/iam/assignment/remove', {
					userId: 1,
					locationId: 1,
				}),
			)
			expect(res.status).toBe(401)
		})
	})
})
