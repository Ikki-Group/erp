import { beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

import { errorHandler } from '@/core/http/error-handler'
import { createMockAuthPlugin, createUnauthenticatedPlugin } from '@/tests/helpers/auth'
import { jsonRequest } from '@/tests/helpers/http'
import { expectPaginatedResponse, expectSuccessResponse } from '@/tests/helpers/response'

import { initLocationRoute } from './location-master.route'
import { LocationMasterService } from './location-master.service'

function createMockService(overrides: Partial<LocationMasterService> = {}): LocationMasterService {
	return {
		handleList: async () => ({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
		handleDetail: async () => ({
			id: 1,
			code: 'MAIN-01',
			name: 'Main Store',
			type: 'store',
			description: null,
			address: null,
			phone: null,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			createdBy: 1,
			updatedBy: 1,
		}),
		handleCreate: async () => ({ id: 1 }),
		handleUpdate: async () => ({ id: 1 }),
		handleRemove: async () => ({ id: 1 }),
		...overrides,
	} as LocationMasterService
}

function createTestApp(service: LocationMasterService, authenticated = true) {
	const app = new Elysia()
	app.use(errorHandler)

	if (authenticated) {
		app.use(createMockAuthPlugin())
	} else {
		app.use(createUnauthenticatedPlugin())
	}

	return app.use(initLocationRoute(service))
}

describe('Location Routes', () => {
	let mockService: LocationMasterService

	beforeEach(() => {
		mockService = createMockService()
	})

	describe('GET /list', () => {
		it('calls service and returns paginated envelope', async () => {
			mockService.handleList = async (filter) => {
				expect(filter.page).toBe(1)
				return {
					data: [{
						id: 1,
						code: 'MAIN-01',
						name: 'Main Store',
						type: 'store',
						description: null,
						address: null,
						phone: null,
						isActive: true,
						createdAt: new Date(),
						updatedAt: new Date(),
						createdBy: 1,
						updatedBy: 1,
					}],
					meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
				}
			}

			const app = createTestApp(mockService)
			const req = jsonRequest('GET', '/list')
			const res = await app.handle(req)
			const body = await res.json()

			expectPaginatedResponse(body)
			expect(body.data).toHaveLength(1)
			expect(body.meta.total).toBe(1)
		})
	})

	describe('GET /detail', () => {
		it('calls service and returns success envelope', async () => {
			mockService.handleDetail = async (id) => {
				expect(id).toBe(1)
				return {
					id: 1,
					code: 'MAIN-01',
					name: 'Main Store',
					type: 'store',
					description: null,
					address: null,
					phone: null,
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}
			}

			const app = createTestApp(mockService)
			const req = jsonRequest('GET', '/detail?id=1')
			const res = await app.handle(req)
			const body = await res.json()

			expectSuccessResponse(body)
			expect((body as { data: { id: number } }).data.id).toBe(1)
		})
	})

	describe('POST /create', () => {
		it('passes authenticated actorId', async () => {
			let capturedActorId: number | undefined
			mockService.handleCreate = async (_data, actorId) => {
				capturedActorId = actorId
				return { id: 1 }
			}

			const app = createTestApp(mockService)
			const req = jsonRequest('POST', '/create', {
				code: 'NEW-01',
				name: 'New Store',
				type: 'store',
				description: null,
				address: null,
				phone: null,
			})
			const res = await app.handle(req)
			const body = await res.json()

			expectSuccessResponse(body)
			expect(capturedActorId).toBe(1)
		})

		it('returns validation error for invalid payload', async () => {
			const app = createTestApp(mockService)
			const req = jsonRequest('POST', '/create', {
				code: 'AB',
				name: 'New Store',
				type: 'store',
				description: null,
				address: null,
				phone: null,
			})
			const res = await app.handle(req)

			expect(res.status).toBe(422)
			const body = await res.json()
			expect((body as { success: boolean }).success).toBe(false)
			expect((body as { code: string }).code).toBe('VALIDATION_ERROR')
		})
	})

	describe('PUT /update', () => {
		it('passes authenticated actorId', async () => {
			let capturedActorId: number | undefined
			mockService.handleUpdate = async (data, actorId) => {
				capturedActorId = actorId
				return { id: data.id }
			}

			const app = createTestApp(mockService)
			const req = jsonRequest('PUT', '/update', {
				id: 1,
				code: 'UPD-01',
				name: 'Updated Store',
				type: 'store',
				description: null,
				address: null,
				phone: null,
			})
			const res = await app.handle(req)
			const body = await res.json()

			expectSuccessResponse(body)
			expect(capturedActorId).toBe(1)
		})
	})

	describe('DELETE /remove', () => {
		it('removes by id', async () => {
			mockService.handleRemove = async (id) => {
				expect(id).toBe(1)
				return { id: 1 }
			}

			const app = createTestApp(mockService)
			const req = jsonRequest('DELETE', '/remove', { id: 1 })
			const res = await app.handle(req)
			const body = await res.json()

			expectSuccessResponse(body)
			expect((body as { data: { id: number } }).data.id).toBe(1)
		})
	})

	describe('authentication', () => {
		it('rejects unauthenticated access', async () => {
			const app = createTestApp(mockService, false)
			const req = jsonRequest('GET', '/list')
			const res = await app.handle(req)

			expect(res.status).toBe(401)
		})
	})
})
