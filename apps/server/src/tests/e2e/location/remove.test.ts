// import { initModules } from '@/modules/_registry'

// import { UserFactory, RoleFactory, LocationFactory } from '@/tests/factories'
// import { createTestClient, type TestClient } from '@/tests/helpers/test-client'
// import { createTestContext, type TestContext } from '@/tests/helpers/test-db'
// import type { ApiResponse, AuthLoginResponse } from '@/tests/helpers/test-types'
// import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
// import '../../setup'

// describe('DELETE /location/remove', () => {
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

// 	test('removes existing location', async () => {
// 		// Arrange
// 		const location = await LocationFactory.create(ctx.db, { name: 'To Be Deleted' })

// 		// Act
// 		const res = await client.withAuth(token).del('/location/remove', { id: location!.id })
// 		const body = (await res.json()) as ApiResponse<{ id: number }>

// 		// Assert
// 		expect(res.status).toBe(200)
// 		expect(body.data.id).toBe(location!.id)

// 		// Verify deleted
// 		const detailRes = await client.withAuth(token).get(`/location/detail?id=${location!.id}`)
// 		expect(detailRes.status).toBe(404)
// 	})

// 	test('returns 404 for non-existent location', async () => {
// 		// Act
// 		const res = await client.withAuth(token).del('/location/remove', { id: 999999 })

// 		// Assert
// 		expect(res.status).toBe(404)
// 	})

// 	test('returns 401 without authentication', async () => {
// 		// Arrange
// 		const location = await LocationFactory.create(ctx.db)

// 		// Act
// 		const res = await client.del('/location/remove', { id: location!.id })

// 		// Assert
// 		expect(res.status).toBe(401)
// 	})
// })
