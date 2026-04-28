import { createTestApp, jsonRequest } from '@/tests/helpers/app'
import { Factory } from '@/tests/helpers/factory'
import { expectSuccessResponse } from '@/tests/helpers/response'
import { describe, expect, it } from 'bun:test'

describe('User Lifecycle Flow', () => {
	describe('Create and Verify User', () => {
		it('creates user and verifies in detail endpoint', async () => {
			// Arrange: Create a role for the user
			const role = await Factory.role({
				code: 'TEST_ROLE',
				name: 'Test Role',
			})

			// Act: Create user via POST /user/create
			const createApp = createTestApp((app) => {
				// Import and use the user route
				const { initUserRoute } = require('@/modules/iam/user/user.route')
				const { UserService } = require('@/modules/iam/user/user.service')
				const { UserRepo } = require('@/modules/iam/user/user.repo')
				const { RoleService } = require('@/modules/iam/role/role.service')
				const { RoleRepo } = require('@/modules/iam/role/role.repo')
				const { UserAssignmentService } = require('@/modules/iam/assignment/assignment.service')
				const { LocationServiceModule } = require('@/modules/location')
				const { getTestDatabase } = require('@/tests/helpers/db')
				const { createTestCache } = require('@/tests/helpers/cache')

				const db = getTestDatabase()
				const cache = createTestCache()

				const locationModule = new LocationServiceModule(db, cache)
				const roleRepo = new RoleRepo(db, cache)
				const roleService = new RoleService(roleRepo)
				const assignmentService = new UserAssignmentService()
				const userRepo = new UserRepo(db, cache)
				const userService = new UserService(
					{
						role: roleService,
						assignment: assignmentService,
						location: locationModule,
					},
					userRepo,
				)

				return app.use(initUserRoute(userService))
			})

			const createRes = await createApp.handle(
				jsonRequest('POST', '/user/create', {
					email: 'flowtest@example.com',
					username: 'flowtest',
					password: 'SecurePass123',
					fullname: 'Flow Test User',
					defaultLocationId: null,
					roleIds: [role.id],
				}),
			)

			// Assert: Create succeeded
			expect(createRes.status).toBe(200)
			const createBody = await createRes.json()
			expectSuccessResponse(createBody)
			const userId = (createBody.data as { id: number }).id

			// Act: Verify user exists in detail endpoint
			const detailRes = await createApp.handle(jsonRequest('GET', `/user/${userId}`))

			// Assert: Detail endpoint returns the created user
			expect(detailRes.status).toBe(200)
			const detailBody = await detailRes.json()
			expectSuccessResponse(detailBody)
			const detailData = detailBody.data as {
				id: number
				email: string
				username: string
				fullname: string
			}
			expect(detailData.id).toBe(userId)
			expect(detailData.email).toBe('flowtest@example.com')
			expect(detailData.username).toBe('flowtest')
			expect(detailData.fullname).toBe('Flow Test User')
		})

		it('creates user and verifies in list endpoint', async () => {
			// Arrange: Create a role
			const role = await Factory.role({
				code: 'LIST_TEST_ROLE',
				name: 'List Test Role',
			})

			// Act: Create user
			const createApp = createTestApp((app) => {
				const { initUserRoute } = require('@/modules/iam/user/user.route')
				const { UserService } = require('@/modules/iam/user/user.service')
				const { UserRepo } = require('@/modules/iam/user/user.repo')
				const { RoleService } = require('@/modules/iam/role/role.service')
				const { RoleRepo } = require('@/modules/iam/role/role.repo')
				const { UserAssignmentService } = require('@/modules/iam/assignment/assignment.service')
				const { LocationServiceModule } = require('@/modules/location')
				const { getTestDatabase } = require('@/tests/helpers/db')
				const { createTestCache } = require('@/tests/helpers/cache')

				const db = getTestDatabase()
				const cache = createTestCache()

				const locationModule = new LocationServiceModule(db, cache)
				const roleRepo = new RoleRepo(db, cache)
				const roleService = new RoleService(roleRepo)
				const assignmentService = new UserAssignmentService()
				const userRepo = new UserRepo(db, cache)
				const userService = new UserService(
					{
						role: roleService,
						assignment: assignmentService,
						location: locationModule,
					},
					userRepo,
				)

				return app.use(initUserRoute(userService))
			})

			await createApp.handle(
				jsonRequest('POST', '/user/create', {
					email: 'listtest@example.com',
					username: 'listtest',
					password: 'SecurePass123',
					fullname: 'List Test User',
					defaultLocationId: null,
					roleIds: [role.id],
				}),
			)

			// Act: Get user list
			const listRes = await createApp.handle(jsonRequest('GET', '/user/list?q=listtest'))

			// Assert: User appears in list
			expect(listRes.status).toBe(200)
			const listBody = await listRes.json()
			expectSuccessResponse(listBody)
			expect(listBody.data.items).toBeArray()
			expect(listBody.data.items.length).toBeGreaterThan(0)
			const createdUser = listBody.data.items.find((u: any) => u.email === 'listtest@example.com')
			expect(createdUser).toBeDefined()
			expect(createdUser.username).toBe('listtest')
		})
	})

	describe('Update and Verify User', () => {
		it('updates user and verifies changes persisted', async () => {
			// Arrange: Create a user
			const user = await Factory.user({
				email: 'updatetest@example.com',
				username: 'updatetest',
				fullname: 'Update Test User',
			})

			// Act: Update user
			const updateApp = createTestApp((app) => {
				const { initUserRoute } = require('@/modules/iam/user/user.route')
				const { UserService } = require('@/modules/iam/user/user.service')
				const { UserRepo } = require('@/modules/iam/user/user.repo')
				const { RoleService } = require('@/modules/iam/role/role.service')
				const { RoleRepo } = require('@/modules/iam/role/role.repo')
				const { UserAssignmentService } = require('@/modules/iam/assignment/assignment.service')
				const { LocationServiceModule } = require('@/modules/location')
				const { getTestDatabase } = require('@/tests/helpers/db')
				const { createTestCache } = require('@/tests/helpers/cache')

				const db = getTestDatabase()
				const cache = createTestCache()

				const locationModule = new LocationServiceModule(db, cache)
				const roleRepo = new RoleRepo(db, cache)
				const roleService = new RoleService(roleRepo)
				const assignmentService = new UserAssignmentService()
				const userRepo = new UserRepo(db, cache)
				const userService = new UserService(
					{
						role: roleService,
						assignment: assignmentService,
						location: locationModule,
					},
					userRepo,
				)

				return app.use(initUserRoute(userService))
			})

			const updateRes = await updateApp.handle(
				jsonRequest('PUT', '/user/update', {
					id: user.id,
					email: 'updatetest@example.com',
					username: 'updatetest',
					fullname: 'Updated Test User',
					defaultLocationId: null,
				}),
			)

			// Assert: Update succeeded
			expect(updateRes.status).toBe(200)
			const updateBody = await updateRes.json()
			expectSuccessResponse(updateBody)

			// Act: Verify changes in detail endpoint
			const detailRes = await updateApp.handle(jsonRequest('GET', `/user/${user.id}`))

			// Assert: Changes persisted
			expect(detailRes.status).toBe(200)
			const detailBody = await detailRes.json()
			expectSuccessResponse(detailBody)
			const detailData = detailBody.data as { fullname: string }
			expect(detailData.fullname).toBe('Updated Test User')
		})
	})

	describe('Delete and Verify User', () => {
		it('deletes user and verifies removal', async () => {
			// Arrange: Create a user
			const user = await Factory.user({
				email: 'deletetest@example.com',
				username: 'deletetest',
			})

			// Act: Delete user
			const deleteApp = createTestApp((app) => {
				const { initUserRoute } = require('@/modules/iam/user/user.route')
				const { UserService } = require('@/modules/iam/user/user.service')
				const { UserRepo } = require('@/modules/iam/user/user.repo')
				const { RoleService } = require('@/modules/iam/role/role.service')
				const { RoleRepo } = require('@/modules/iam/role/role.repo')
				const { UserAssignmentService } = require('@/modules/iam/assignment/assignment.service')
				const { LocationServiceModule } = require('@/modules/location')
				const { getTestDatabase } = require('@/tests/helpers/db')
				const { createTestCache } = require('@/tests/helpers/cache')

				const db = getTestDatabase()
				const cache = createTestCache()

				const locationModule = new LocationServiceModule(db, cache)
				const roleRepo = new RoleRepo(db, cache)
				const roleService = new RoleService(roleRepo)
				const assignmentService = new UserAssignmentService()
				const userRepo = new UserRepo(db, cache)
				const userService = new UserService(
					{
						role: roleService,
						assignment: assignmentService,
						location: locationModule,
					},
					userRepo,
				)

				return app.use(initUserRoute(userService))
			})

			const deleteRes = await deleteApp.handle(
				jsonRequest('DELETE', '/user/delete', {
					id: user.id,
				}),
			)

			// Assert: Delete succeeded
			expect(deleteRes.status).toBe(200)
			const deleteBody = await deleteRes.json()
			expectSuccessResponse(deleteBody)

			// Act: Try to get deleted user
			const detailRes = await deleteApp.handle(jsonRequest('GET', `/user/${user.id}`))

			// Assert: User not found
			expect(detailRes.status).toBe(404)
		})
	})
})
