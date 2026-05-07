import { testCtx } from '../setup'
import { beforeAll, describe, test, expect } from 'bun:test'
import type { ApiResponse, AuthLoginResponse } from '../helpers/test-types'

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
			const loginJson = await testCtx.client.toJsonResponse<ApiResponse<AuthLoginResponse>>(loginRes)
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
})