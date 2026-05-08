import type { ApiResponse, AuthLoginResponse } from '../helpers/test-types'
import { testCtx } from '../setup'
import { beforeAll, describe, test, expect } from 'bun:test'

describe('e2e/iam', () => {
	let adminRoleId: number
	let locationId: number
	let testRoleId: number
	let testUserId: number

	beforeAll(async () => {
		// Login admin
		const loginRes = await testCtx.client.post('/auth/login', {
			identifier: 'admin@ikki.com',
			password: 'admin12345',
		})
		const loginJson = await testCtx.client.toJsonResponse<ApiResponse<AuthLoginResponse>>(loginRes)
		testCtx.tokens.register('admin', loginJson.data)
		const client = testCtx.client.as('admin')

		// Get a location
		const locRes = await client.get('/location/list?limit=1')
		const locJson = await client.toJsonResponse<ApiResponse<any[]>>(locRes)
		if (locJson.data.length === 0) {
			throw new Error('No location found for IAM tests')
		}
		locationId = locJson.data[0].id

		// Get admin role
		const roleRes = await client.get('/iam/role/list?q=ADMIN')
		const roleJson = await client.toJsonResponse<ApiResponse<any[]>>(roleRes)
		if (roleJson.data.length === 0) {
			throw new Error('No ADMIN role found for IAM tests')
		}
		adminRoleId = roleJson.data[0].id
	})

	describe('Roles', () => {
		test.serial('create, get by id, update, list, remove', async () => {
			const client = testCtx.client.as('admin')

			// Create
			const createRes = await client.post('/iam/role/create', {
				code: 'TEST_ROLE',
				name: 'Test Role',
				description: 'Description',
				permissions: ['iam.user.read'],
			})
			const createJson = await client.toJsonResponse<ApiResponse<{ id: number }>>(createRes)
			expect(createRes.status).toBe(200)
			testRoleId = createJson.data.id

			// Get by ID
			const detailRes = await client.get(`/iam/role/detail?id=${testRoleId}`)
			expect(detailRes.status).toBe(200)

			// Update
			const updateRes = await client.put('/iam/role/update', {
				id: testRoleId,
				code: 'TEST_ROLE_UPDATED',
				name: 'Test Role Updated',
				description: 'Updated Description',
				permissions: ['iam.user.read', 'iam.user.write'],
			})
			expect(updateRes.status).toBe(200)

			// List
			const listRes = await client.get('/iam/role/list?q=TEST_ROLE_UPDATED')
			const listJson = await client.toJsonResponse<ApiResponse<any[]>>(listRes)
			expect(listJson.data.length).toBeGreaterThan(0)

			// Remove
			const removeRes = await client.del('/iam/role/remove', { id: testRoleId })
			expect(removeRes.status).toBe(200)
		})
	})

	describe('User (root)', () => {
		test.serial('Create root user', async () => {
			const client = testCtx.client.as('admin')

			const res = await client.post('/iam/user/create', {
				email: 'root_test@ikki.com',
				username: 'root_test',
				fullname: 'Root Test User',
				password: 'password12345',
				isActive: true,
				isRoot: true,
				defaultLocationId: locationId,
				assignments: [
					{
						locationId,
						roleId: adminRoleId,
					},
				],
			})
			const json = await client.toJsonResponse<ApiResponse<{ id: number }>>(res)
			expect(res.status).toBe(201)
			testUserId = json.data.id
		})

		test.serial('get detail', async () => {
			const client = testCtx.client.as('admin')
			const res = await client.get(`/iam/user/detail?id=${testUserId}`)
			expect(res.status).toBe(200)
		})

		test.serial('update', async () => {
			const client = testCtx.client.as('admin')
			const res = await client.put('/iam/user/update', {
				id: testUserId,
				email: 'root_test_updated@ikki.com',
				username: 'root_test_updated',
				fullname: 'Root Test Updated',
				isActive: true,
				isRoot: true,
				defaultLocationId: locationId,
				assignments: [
					{
						locationId,
						roleId: adminRoleId,
					},
				],
			})
			expect(res.status).toBe(200)
		})

		test.serial('change password', async () => {
			// Login as the new user first
			const loginRes = await testCtx.client.post('/auth/login', {
				identifier: 'root_test_updated@ikki.com',
				password: 'password12345',
			})
			const loginJson =
				await testCtx.client.toJsonResponse<ApiResponse<AuthLoginResponse>>(loginRes)
			testCtx.tokens.register('test_user', loginJson.data)

			const client = testCtx.client.as('test_user')
			const res = await client.post('/iam/user/change-password', {
				oldPassword: 'password12345',
				newPassword: 'newpassword12345',
			})
			expect(res.status).toBe(200)
		})

		test.serial('password reset', async () => {
			const client = testCtx.client.as('admin')
			const res = await client.post('/iam/user/admin/password-reset', {
				id: testUserId,
				password: 'resetpassword12345',
			})
			expect(res.status).toBe(200)
		})

		test.serial('remove and check by id', async () => {
			const client = testCtx.client.as('admin')
			const res = await client.del('/iam/user/remove', { id: testUserId })
			expect(res.status).toBe(200)

			const detailRes = await client.get(`/iam/user/detail?id=${testUserId}`)
			expect(detailRes.status).toBe(404)
		})
	})

	describe('User (non-root)', () => {
		let regularUserId: number
		let regularRoleId: number

		test.serial('create regular role', async () => {
			const client = testCtx.client.as('admin')

			const res = await client.post('/iam/role/create', {
				code: 'REGULAR_ROLE',
				name: 'Regular Role',
				description: 'Regular user role',
				permissions: ['iam.user.read'],
			})
			const json = await client.toJsonResponse<ApiResponse<{ id: number }>>(res)
			expect(res.status).toBe(200)
			regularRoleId = json.data.id
		})

		test.serial('create regular user', async () => {
			const client = testCtx.client.as('admin')

			const res = await client.post('/iam/user/create', {
				email: 'regular_test@ikki.com',
				username: 'regular_test',
				fullname: 'Regular Test User',
				password: 'password12345',
				isActive: true,
				isRoot: false,
				defaultLocationId: locationId,
				assignments: [
					{
						locationId,
						roleId: regularRoleId,
					},
				],
			})
			const json = await client.toJsonResponse<ApiResponse<{ id: number }>>(res)
			expect(res.status).toBe(201)
			regularUserId = json.data.id
		})

		test.serial('list users', async () => {
			const client = testCtx.client.as('admin')
			const res = await client.get('/iam/user/list?q=regular_test')
			const json = await client.toJsonResponse<ApiResponse<any[]>>(res)
			expect(res.status).toBe(200)
			expect(json.data.length).toBeGreaterThan(0)
		})

		test.serial('get detail', async () => {
			const client = testCtx.client.as('admin')
			const res = await client.get(`/iam/user/detail?id=${regularUserId}`)
			expect(res.status).toBe(200)
		})

		test.serial('update', async () => {
			const client = testCtx.client.as('admin')
			const res = await client.put('/iam/user/update', {
				id: regularUserId,
				email: 'regular_test_updated@ikki.com',
				username: 'regular_test_updated',
				fullname: 'Regular Test Updated',
				isActive: true,
				isRoot: false,
				defaultLocationId: locationId,
				assignments: [
					{
						locationId,
						roleId: regularRoleId,
					},
				],
			})
			expect(res.status).toBe(200)
		})

		test.serial('remove regular user and role', async () => {
			const client = testCtx.client.as('admin')

			const userRes = await client.del('/iam/user/remove', { id: regularUserId })
			expect(userRes.status).toBe(200)

			const roleRes = await client.del('/iam/role/remove', { id: regularRoleId })
			expect(roleRes.status).toBe(200)
		})
	})

	describe('Assignments', () => {
		let assignmentUserId: number
		let assignmentRoleId: number
		let secondLocationId: number

		test.serial('setup: create test role and user', async () => {
			const client = testCtx.client.as('admin')

			// Create role
			const roleRes = await client.post('/iam/role/create', {
				code: 'ASSIGN_ROLE',
				name: 'Assignment Role',
				description: 'Role for assignment tests',
				permissions: ['iam.user.read'],
			})
			const roleJson = await client.toJsonResponse<ApiResponse<{ id: number }>>(roleRes)
			assignmentRoleId = roleJson.data.id

			// Create user
			const userRes = await client.post('/iam/user/create', {
				email: 'assign_test@ikki.com',
				username: 'assign_test',
				fullname: 'Assignment Test User',
				password: 'password12345',
				isActive: true,
				isRoot: false,
				defaultLocationId: locationId,
				assignments: [],
			})
			const userJson = await client.toJsonResponse<ApiResponse<{ id: number }>>(userRes)
			assignmentUserId = userJson.data.id
		})

		test.serial('setup: get second location', async () => {
			const client = testCtx.client.as('admin')

			const locRes = await client.get('/location/list?limit=2')
			const locJson = await client.toJsonResponse<ApiResponse<any[]>>(locRes)
			if (locJson.data.length < 2) {
				throw new Error('Need at least 2 locations for assignment tests')
			}
			secondLocationId = locJson.data[1].id
		})

		test.serial('list assignments', async () => {
			const client = testCtx.client.as('admin')
			const res = await client.get('/iam/assignment/list')
			expect(res.status).toBe(200)
		})

		test.serial('assign user to location', async () => {
			const client = testCtx.client.as('admin')
			const res = await client.post('/iam/assignment/assign', {
				userId: assignmentUserId,
				locationId,
				roleId: assignmentRoleId,
			})
			expect(res.status).toBe(200)
		})

		test.serial('assign user to second location', async () => {
			const client = testCtx.client.as('admin')
			const res = await client.post('/iam/assignment/assign', {
				userId: assignmentUserId,
				locationId: secondLocationId,
				roleId: assignmentRoleId,
			})
			expect(res.status).toBe(200)
		})

		test.serial('assign bulk - assign multiple users to location', async () => {
			const client = testCtx.client.as('admin')

			// Create another user for bulk test
			const userRes = await client.post('/iam/user/create', {
				email: 'bulk_test@ikki.com',
				username: 'bulk_test',
				fullname: 'Bulk Test User',
				password: 'password12345',
				isActive: true,
				isRoot: false,
				defaultLocationId: locationId,
				assignments: [],
			})
			const userJson = await client.toJsonResponse<ApiResponse<{ id: number }>>(userRes)
			const bulkUserId = userJson.data.id

			const res = await client.post('/iam/assignment/assign-bulk', {
				userIds: [assignmentUserId, bulkUserId],
				locationId,
				roleId: assignmentRoleId,
			})
			expect(res.status).toBe(200)

			// Cleanup bulk user
			await client.del('/iam/user/remove', { id: bulkUserId })
		})

		test.serial('update role bulk', async () => {
			const client = testCtx.client.as('admin')

			// Create another role for update test
			const roleRes = await client.post('/iam/role/create', {
				code: 'UPDATE_ROLE',
				name: 'Update Role',
				description: 'Role for update test',
				permissions: ['iam.user.write'],
			})
			const roleJson = await client.toJsonResponse<ApiResponse<{ id: number }>>(roleRes)
			const updateRoleId = roleJson.data.id

			const res = await client.post('/iam/assignment/update-role-bulk', {
				userIds: [assignmentUserId],
				locationId,
				roleId: updateRoleId,
			})
			expect(res.status).toBe(200)

			// Cleanup update role
			await client.del('/iam/role/remove', { id: updateRoleId })
		})

		test.serial('remove assignment from location', async () => {
			const client = testCtx.client.as('admin')
			const res = await client.del('/iam/assignment/remove', {
				userId: assignmentUserId,
				locationId: secondLocationId,
			})
			expect(res.status).toBe(200)
		})

		test.serial('remove bulk - remove users from location', async () => {
			const client = testCtx.client.as('admin')

			// Create another user for bulk remove test
			const userRes = await client.post('/iam/user/create', {
				email: 'bulk_remove_test@ikki.com',
				username: 'bulk_remove_test',
				fullname: 'Bulk Remove Test User',
				password: 'password12345',
				isActive: true,
				isRoot: false,
				defaultLocationId: locationId,
				assignments: [],
			})
			const userJson = await client.toJsonResponse<ApiResponse<{ id: number }>>(userRes)
			const bulkRemoveUserId = userJson.data.id

			// Assign user to location first
			await client.post('/iam/assignment/assign', {
				userId: bulkRemoveUserId,
				locationId,
				roleId: assignmentRoleId,
			})

			const res = await client.del('/iam/assignment/remove-bulk', {
				userIds: [assignmentUserId, bulkRemoveUserId],
				locationId,
			})
			expect(res.status).toBe(200)

			// Cleanup bulk remove user
			await client.del('/iam/user/remove', { id: bulkRemoveUserId })
		})

		test.serial('cleanup: remove test user and role', async () => {
			const client = testCtx.client.as('admin')

			await client.del('/iam/user/remove', { id: assignmentUserId })
			await client.del('/iam/role/remove', { id: assignmentRoleId })
		})
	})
})
