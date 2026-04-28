import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { errorHandler } from '@/core/http/error-handler'
import { requestIdPlugin } from '@/core/http/request-id'

import { LocationMasterRepo } from '@/modules/location/location-master/location-master.repo'
import { initLocationRoute } from '@/modules/location/location-master/location-master.route'
import { LocationMasterService } from '@/modules/location/location-master/location-master.service'

import { setupIntegrationTests, Factory } from '@/tests/helpers'
import { createMockAuthPlugin } from '@/tests/helpers/auth'
import { expectSuccessResponse, expectPaginatedResponse } from '@/tests/helpers/response'
import { describe, expect, it, beforeAll } from 'bun:test'

// Setup test lifecycle (DB + cache cleanup)
setupIntegrationTests()

// Shared test context
let app: Elysia
let service: LocationMasterService

// HTTP request helpers
const http = {
	get: (path: string) => new Request(`http://localhost${path}`),

	post: (path: string, body: unknown) =>
		new Request(`http://localhost${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		}),

	put: (path: string, body: unknown) =>
		new Request(`http://localhost${path}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		}),

	delete: (path: string, body: unknown) =>
		new Request(`http://localhost${path}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		}),
}

// Response helper
async function expectOK<T>(res: Response): Promise<T> {
	expect(res.status).toBe(200)
	const body = await res.json()
	expectSuccessResponse(body)
	return body.data as T
}

// Initialize shared app once
beforeAll(() => {
	const repo = new LocationMasterRepo()
	service = new LocationMasterService(repo)
	const route = initLocationRoute(service)

	app = new Elysia()
		.use(errorHandler)
		.use(requestIdPlugin())
		.use(cors())
		.use(createMockAuthPlugin())
		.use(route)
})

describe('Location HTTP Endpoints', () => {
	describe('POST /create', () => {
		it('creates a new location and returns id', async () => {
			const res = await app.handle(
				http.post('/create', {
					code: 'WH-001',
					name: 'Main Warehouse',
					type: 'warehouse',
					description: 'Primary storage location',
					address: '123 Main St',
					phone: '+1234567890',
				}),
			)

			const data = await expectOK<{ id: number }>(res)
			expect(data.id).toBeGreaterThan(0)
		})

		it('returns 422 for invalid payload', async () => {
			const res = await app.handle(
				http.post('/create', {
					code: 'AB', // too short
					name: 'Test',
					type: 'warehouse',
				}),
			)

			expect(res.status).toBe(422)
		})
	})

	describe('GET /list', () => {
		it('returns paginated location list', async () => {
			// Arrange: Create test locations in DB
			await Factory.location({ code: 'STORE-001', name: 'Store One', type: 'store' })
			await Factory.location({ code: 'WH-001', name: 'Warehouse One', type: 'warehouse' })

			const res = await app.handle(http.get('/list?page=1&limit=10'))

			expect(res.status).toBe(200)
			const body = await res.json()
			expectPaginatedResponse(body)
			expect(body.data.length).toBeGreaterThanOrEqual(2)
			expect(body.meta.total).toBeGreaterThanOrEqual(2)
		})
	})

	describe('GET /detail', () => {
		it('returns location by id', async () => {
			// Arrange: Create a location first
			const location = await Factory.location({
				code: 'DETAIL-001',
				name: 'Detail Test Location',
				type: 'warehouse',
			})

			const res = await app.handle(http.get(`/detail?id=${location.id}`))

			const data = await expectOK<{ id: number; code: string }>(res)
			expect(data.id).toBe(location.id)
			expect(data.code).toBe('DETAIL-001')
		})
	})

	describe('PUT /update', () => {
		it('updates existing location', async () => {
			// Arrange: Create a location
			const location = await Factory.location({
				code: 'UPDATE-001',
				name: 'Before Update',
				type: 'warehouse',
			})

			const res = await app.handle(
				http.put('/update', {
					id: location.id,
					code: 'UPDATE-001',
					name: 'After Update',
					type: 'warehouse',
					description: 'Updated description',
				}),
			)

			const data = await expectOK<{ id: number }>(res)
			expect(data.id).toBe(location.id)
		})
	})

	describe('DELETE /remove', () => {
		it('removes location by id', async () => {
			// Arrange: Create a location
			const location = await Factory.location({
				code: 'DELETE-001',
				name: 'To Be Deleted',
				type: 'warehouse',
			})

			const res = await app.handle(http.delete('/remove', { id: location.id }))

			const data = await expectOK<{ id: number }>(res)
			expect(data.id).toBe(location.id)
		})
	})
})
