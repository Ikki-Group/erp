// import { initModules } from '@/modules/_registry'

// import { UserFactory, RoleFactory, LocationFactory } from '@/tests/factories'
// import { createTestClient, type TestClient } from '@/tests/helpers/test-client'
// import { createTestContext, type TestContext } from '@/tests/helpers/test-db'
// import type { ApiResponse, AuthLoginResponse, LocationData } from '@/tests/helpers/test-types'
// import { describe, test, expect, beforeEach, afterEach } from 'bun:test'

// /**
//  * Full CRUD flow test for Location.
//  * Tests the complete lifecycle: create → read → update → delete
//  */
// describe('Location Full CRUD Flow', () => {
// 	let ctx: TestContext
// 	let client: TestClient
// 	let token: string

// 	beforeEach(async () => {
// 		ctx = await createTestContext()
// 		const modules = initModules(ctx.db)
// 		client = createTestClient(modules)

// 		// Setup authenticated user
// 		const role = await RoleFactory.create(ctx.db)
// 		const location = await LocationFactory.create(ctx.db)
// 		const user = await UserFactory.createWithAssignment(ctx.db, {
// 			roleId: role!.id,
// 			locationId: location!.id,
// 		})

// 		const loginRes = await client.post('/auth/login', {
// 			identifier: user!.email,
// 			password: 'password123',
// 		})
// 		const loginBody = (await loginRes.json()) as ApiResponse<AuthLoginResponse>
// 		token = loginBody.data.token
// 	})

// 	afterEach(async () => {
// 		await ctx.cleanup()
// 	})

// 	test('complete CRUD flow', async () => {
// 		// 1. CREATE location
// 		const createRes = await client.withAuth(token).post('/location/create', {
// 			code: 'FLOW-TEST-001',
// 			name: 'Flow Test Location',
// 			type: 'store',
// 			description: null,
// 			address: '123 Flow Street',
// 			phone: null,
// 			isActive: true,
// 		})
// 		expect(createRes.status).toBe(200)
// 		const createBody = (await createRes.json()) as ApiResponse<{ id: number }>
// 		const locationId = createBody.data.id
// 		expect(locationId).toBeDefined()

// 		// 2. GET detail - verify created data
// 		const detailRes = await client.withAuth(token).get(`/location/detail?id=${locationId}`)
// 		expect(detailRes.status).toBe(200)
// 		const detailBody = (await detailRes.json()) as ApiResponse<LocationData>
// 		expect(detailBody.data.code).toBe('FLOW-TEST-001')
// 		expect(detailBody.data.name).toBe('Flow Test Location')
// 		expect(detailBody.data.type).toBe('store')
// 		expect(detailBody.data.address).toBe('123 Flow Street')

// 		// 3. SEARCH list - verify appears in search
// 		const searchRes = await client.withAuth(token).get('/location/list?q=Flow Test')
// 		expect(searchRes.status).toBe(200)
// 		const searchBody = (await searchRes.json()) as ApiResponse<LocationData[]>
// 		expect(searchBody.data.some((l) => l.id === locationId)).toBe(true)

// 		// 4. UPDATE location
// 		const updateRes = await client.withAuth(token).put('/location/update', {
// 			id: locationId,
// 			code: 'FLOW-TEST-001',
// 			name: 'Updated Flow Location',
// 			type: 'warehouse',
// 			description: null,
// 			address: '456 Updated Ave',
// 			phone: null,
// 			isActive: true,
// 		})
// 		expect(updateRes.status).toBe(200)

// 		// 5. GET detail - verify updated data
// 		const updatedDetailRes = await client.withAuth(token).get(`/location/detail?id=${locationId}`)
// 		expect(updatedDetailRes.status).toBe(200)
// 		const updatedDetailBody = (await updatedDetailRes.json()) as ApiResponse<LocationData>
// 		expect(updatedDetailBody.data.name).toBe('Updated Flow Location')
// 		expect(updatedDetailBody.data.type).toBe('warehouse')
// 		expect(updatedDetailBody.data.address).toBe('456 Updated Ave')

// 		// 6. REMOVE location
// 		const removeRes = await client.withAuth(token).del('/location/remove', { id: locationId })
// 		expect(removeRes.status).toBe(200)

// 		// 7. GET detail - expect 404
// 		const deletedDetailRes = await client.withAuth(token).get(`/location/detail?id=${locationId}`)
// 		expect(deletedDetailRes.status).toBe(404)
// 	})
// })
