import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { errorHandler } from '@/core/http/error-handler'
import { requestIdPlugin } from '@/core/http/request-id'

import { UserAssignmentService } from '@/modules/iam/assignment/assignment.service'
import { RoleRepo } from '@/modules/iam/role/role.repo'
import { RoleService } from '@/modules/iam/role/role.service'
import { UserRepo } from '@/modules/iam/user/user.repo'
import { initUserRoute } from '@/modules/iam/user/user.route'
import { UserService } from '@/modules/iam/user/user.service'
import { LocationServiceModule } from '@/modules/location'

import {
	setupIntegrationTests,
	Factory,
	IamFixtures,
	getTestDatabase,
	createTestCache,
} from '@/tests/helpers'
import { createMockAuthPlugin } from '@/tests/helpers/auth'
import { expectSuccessResponse, expectPaginatedResponse } from '@/tests/helpers/response'
import { describe, expect, it, beforeAll } from 'bun:test'

// Setup test lifecycle
setupIntegrationTests()

// Shared test context
let app: Elysia
let userService: UserService

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
	const db = getTestDatabase()
	const cache = createTestCache()

	const locationModule = new LocationServiceModule(db, cache)
	const roleRepo = new RoleRepo(db, cache)
	const roleService = new RoleService(roleRepo)
	const assignmentService = new UserAssignmentService()
	const userRepo = new UserRepo(db, cache)
	userService = new UserService(
		{
			role: roleService,
			assignment: assignmentService,
			location: locationModule,
		},
		userRepo,
	)

	const route = initUserRoute(userService)

	app = new Elysia()
		.use(errorHandler)
		.use(requestIdPlugin())
		.use(cors())
		.use(createMockAuthPlugin())
		.use(route)
})

describe('IAM / User HTTP Endpoints', () => {
	describe('POST /user/create', () => {
		it('creates a new user and returns id', async () => {
			// Arrange: Create a role first (for default assignment)
			const role = await IamFixtures.adminRole()

			const res = await app.handle(
				http.post('/user/create', {
					email: 'newuser@test.com',
					username: 'newuser',
					password: 'securePassword123',
					fullname: 'New Test User',
					defaultLocationId: null,
					roleIds: [role.id],
				}),
			)

			const data = await expectOK<{ id: number }>(res)
			expect(data.id).toBeGreaterThan(0)
		})

		it('returns 422 for duplicate email', async () => {
			// Arrange: Create a user
			const user = await IamFixtures.regularUser()

			// Act: Try to create another user with same email
			const res = await app.handle(
				http.post('/user/create', {
					email: user.email,
					username: 'different',
					password: 'password123',
					fullname: 'Duplicate Email User',
				}),
			)

			// Assert: Should fail with validation error
			expect(res.status).toBe(422)
		})
	})

	describe('GET /user/list', () => {
		it('returns paginated user list', async () => {
			// Arrange: Create test users
			await IamFixtures.adminUser()
			await IamFixtures.regularUser()
			await IamFixtures.inactiveUser()

			const res = await app.handle(http.get('/user/list?page=1&limit=10'))

			expect(res.status).toBe(200)
			const body = await res.json()
			expectPaginatedResponse(body)
			expect(body.data.length).toBeGreaterThanOrEqual(3)
			expect(body.meta.total).toBeGreaterThanOrEqual(3)
		})

		it('filters by active status', async () => {
			// Arrange
			await IamFixtures.adminUser()
			await IamFixtures.inactiveUser()

			const res = await app.handle(http.get('/user/list?page=1&limit=10&isActive=true'))

			expect(res.status).toBe(200)
			const body = await res.json()
			expectPaginatedResponse(body)
			// Should only return active users
			expect((body.data as Array<{ isActive: boolean }>).every((u) => u.isActive)).toBe(true)
		})
	})

	describe('GET /user/detail', () => {
		it('returns user by id', async () => {
			// Arrange: Create a user
			const user = await IamFixtures.adminUser()

			const res = await app.handle(http.get(`/user/detail?id=${user.id}`))

			const data = await expectOK<{ id: number; email: string; fullname: string }>(res)
			expect(data.id).toBe(user.id)
			expect(data.email).toBe(user.email)
			expect(data.fullname).toBe(user.fullname)
		})
	})

	describe('PUT /user/update', () => {
		it('updates existing user', async () => {
			// Arrange: Create a user
			const user = await IamFixtures.regularUser()

			const res = await app.handle(
				http.put('/user/update', {
					id: user.id,
					email: user.email,
					username: user.username,
					fullname: 'Updated Fullname',
					isActive: user.isActive,
				}),
			)

			const data = await expectOK<{ id: number }>(res)
			expect(data.id).toBe(user.id)
		})
	})

	describe('DELETE /user/remove', () => {
		it('soft-deletes user by id', async () => {
			// Arrange: Create a user
			const user = await Factory.user({
				email: 'todelete@test.com',
				username: 'todelete',
				fullname: 'To Be Deleted',
			})

			const res = await app.handle(http.delete('/user/remove', { id: user.id }))

			const data = await expectOK<{ id: number }>(res)
			expect(data.id).toBe(user.id)
		})
	})
})
