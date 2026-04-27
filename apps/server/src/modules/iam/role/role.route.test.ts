import { beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

import { errorHandler } from '@/core/http/error-handler'
import { createMockAuthPlugin, createUnauthenticatedPlugin } from '@/tests/helpers/auth'
import { jsonRequest } from '@/tests/helpers/http'
import { expectPaginatedResponse, expectSuccessResponse } from '@/tests/helpers/response'

import { initRoleRoute } from './role.route'
import { RoleService } from './role.service'

function createMockService(overrides: Partial<RoleService> = {}): RoleService {
	return {
		handleList: async () => ({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
		handleDetail: async () => ({
			id: 1,
			code: 'ADMIN',
			name: 'Administrator',
			description: null,
			permissions: [],
			isSystem: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			createdBy: 1,
			updatedBy: 1,
		}),
		handleCreate: async () => ({ id: 1 }),
		handleUpdate: async () => ({ id: 1 }),
		handleRemove: async () => ({ id: 1 }),
		...overrides,
	} as RoleService
}

function createTestApp(service: RoleService, authenticated = true) {
	const app = new Elysia()
	app.use(errorHandler)

	if (authenticated) {
		app.use(createMockAuthPlugin())
	} else {
		app.use(createUnauthenticatedPlugin())
	}

	return app.use(initRoleRoute(service))
}

describe('Role Routes', () => {
	let mockService: RoleService

	beforeEach(() => {
		mockService = createMockService()
	})

	describe('GET /role/list', () => {
		it('returns paginated envelope', async () => {
			mockService.handleList = async () => ({
				data: [{
					id: 1,
					code: 'ADMIN',
					name: 'Administrator',
					description: null,
					permissions: [],
					isSystem: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			})

			const app = createTestApp(mockService)
			const req = jsonRequest('GET', '/role/list')
			const res = await app.handle(req)
			const body = await res.json()

			expectPaginatedResponse(body)
			expect(body.data).toHaveLength(1)
			expect(body.meta.total).toBe(1)
		})
	})

	describe('GET /role/detail', () => {
		it('returns success envelope', async () => {
			mockService.handleDetail = async (id) => {
				expect(id).toBe(1)
				return {
					id: 1,
					code: 'ADMIN',
					name: 'Administrator',
					description: null,
					permissions: [],
					isSystem: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}
			}

			const app = createTestApp(mockService)
			const req = jsonRequest('GET', '/role/detail?id=1')
			const res = await app.handle(req)
			const body = await res.json()

			expectSuccessResponse(body)
			expect((body as { data: { id: number } }).data.id).toBe(1)
		})
	})

	describe('POST /role/create', () => {
		it('passes authenticated actorId', async () => {
			let capturedActorId: number | undefined
			mockService.handleCreate = async (_data, actorId) => {
				capturedActorId = actorId
				return { id: 1 }
			}

			const app = createTestApp(mockService)
			const req = jsonRequest('POST', '/role/create', {
				code: 'MANAGER',
				name: 'Manager',
				description: null,
				permissions: [],
			})
			const res = await app.handle(req)
			const body = await res.json()

			expectSuccessResponse(body)
			expect(capturedActorId).toBe(1)
		})

		it('returns validation error for invalid payload', async () => {
			const app = createTestApp(mockService)
			const req = jsonRequest('POST', '/role/create', {
				code: 'A',
				name: 'Manager',
				description: null,
				permissions: [],
			})
			const res = await app.handle(req)

			expect(res.status).toBe(422)
			const body = await res.json()
			expect((body as { success: boolean }).success).toBe(false)
			expect((body as { code: string }).code).toBe('VALIDATION_ERROR')
		})
	})

	describe('PUT /role/update', () => {
		it('passes authenticated actorId', async () => {
			let capturedActorId: number | undefined
			mockService.handleUpdate = async (data, actorId) => {
				capturedActorId = actorId
				return { id: data.id }
			}

			const app = createTestApp(mockService)
			const req = jsonRequest('PUT', '/role/update', {
				id: 1,
				code: 'UPDATED',
				name: 'Updated Admin',
				description: null,
				permissions: [],
				isSystem: false,
			})
			const res = await app.handle(req)
			const body = await res.json()

			expectSuccessResponse(body)
			expect(capturedActorId).toBe(1)
		})
	})

	describe('DELETE /role/remove', () => {
		it('removes by id', async () => {
			mockService.handleRemove = async (id) => {
				expect(id).toBe(1)
				return { id: 1 }
			}

			const app = createTestApp(mockService)
			const req = jsonRequest('DELETE', '/role/remove', { id: 1 })
			const res = await app.handle(req)
			const body = await res.json()

			expectSuccessResponse(body)
			expect((body as { data: { id: number } }).data.id).toBe(1)
		})
	})

	describe('authentication', () => {
		it('rejects unauthenticated access', async () => {
			const app = createTestApp(mockService, false)
			const req = jsonRequest('GET', '/role/list')
			const res = await app.handle(req)

			expect(res.status).toBe(401)
		})
	})
})
