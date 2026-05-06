// import { initModules } from '@/modules/_registry'

// import { UserFactory, RoleFactory, LocationFactory } from '@/tests/factories'
// import { createTestClient, type TestClient } from '@/tests/helpers/test-client'
// import { createTestContext, type TestContext } from '@/tests/helpers/test-db'
// import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
// import '../../setup'

// describe('GET /auth/me (protected route)', () => {
// 	let ctx: TestContext
// 	let client: TestClient

// 	beforeEach(async () => {
// 		ctx = await createTestContext()
// 		const modules = initModules(ctx.db)
// 		client = createTestClient(modules)
// 	})

// 	afterEach(async () => {
// 		await ctx.cleanup()
// 	})

// 	test('access protected route with valid token', async () => {
// 		// Arrange
// 		const role = await RoleFactory.create(ctx.db)
// 		const location = await LocationFactory.create(ctx.db)
// 		const user = await UserFactory.createWithAssignment(ctx.db, {
// 			roleId: role!.id,
// 			locationId: location!.id,
// 		})

// 		// Login to get token
// 		const loginRes = await client.post('/auth/login', {
// 			identifier: user!.email,
// 			password: 'password123',
// 		})
// 		const loginBody = (await loginRes.json()) as { data: { token: string } }

// 		// Act
// 		const res = await client.withAuth(loginBody.data.token).get('/auth/me')
// 		const body = (await res.json()) as { data: { id: number; email: string } }

// 		// Assert
// 		expect(res.status).toBe(200)
// 		expect(body.data.id).toBe(user!.id)
// 		expect(body.data.email).toBe(user!.email)
// 	})

// 	test('access protected route without token returns 401', async () => {
// 		// Act
// 		const res = await client.get('/auth/me')

// 		// Assert
// 		expect(res.status).toBe(401)
// 	})

// 	test('access protected route with invalid token returns 401', async () => {
// 		// Act
// 		const res = await client.withAuth('invalid-token').get('/auth/me')

// 		// Assert
// 		expect(res.status).toBe(401)
// 	})
// })
