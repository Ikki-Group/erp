import { UserFactory, RoleFactory, LocationFactory } from '@/tests/factories'
import { type TestClient } from '@/tests/helpers/test-client'
import { type TestContext } from '@/tests/helpers/test-db'
import { describe, test, expect } from 'bun:test'

describe('POST /auth/login', () => {
	let ctx: TestContext
	let client: TestClient

	// beforeEach(async () => {
	// 	ctx = await createTestContext()
	// 	const modules = initModules(ctx.db)
	// 	client = createTestClient(modules)
	// })

	// afterEach(async () => {
	// 	await ctx.cleanup()
	// })

	test('login success with valid credentials', async () => {
		// Arrange
		const role = await RoleFactory.create(ctx.db)
		const location = await LocationFactory.create(ctx.db)
		const user = await UserFactory.createWithAssignment(ctx.db, {
			roleId: role!.id,
			locationId: location!.id,
		})

		// Act
		const res = await client.post('/auth/login', {
			identifier: user!.email,
			password: 'password123',
		})
		const body = (await res.json()) as {
			success: boolean
			data: { token: string; user: { email: string } }
		}

		// Assert
		expect(res.status).toBe(200)
		expect(body.success).toBe(true)
		expect(body.data.token).toBeDefined()
		expect(body.data.user.email).toBe(user!.email)
	})

	// test('login fails with invalid password', async () => {
	// 	// Arrange
	// 	const role = await RoleFactory.create(ctx.db)
	// 	const location = await LocationFactory.create(ctx.db)
	// 	await UserFactory.createWithAssignment(ctx.db, {
	// 		roleId: role!.id,
	// 		locationId: location!.id,
	// 	})

	// 	// Act
	// 	const res = await client.post('/auth/login', {
	// 		identifier: 'test@test.com',
	// 		password: 'wrongpassword',
	// 	})

	// 	// Assert
	// 	expect(res.status).toBe(401)
	// })

	// test('login fails with non-existent user', async () => {
	// 	// Act
	// 	const res = await client.post('/auth/login', {
	// 		identifier: 'nonexistent@test.com',
	// 		password: 'password123',
	// 	})

	// 	// Assert
	// 	expect(res.status).toBe(401)
	// })

	// test('login fails with inactive user', async () => {
	// 	// Arrange
	// 	const role = await RoleFactory.create(ctx.db)
	// 	const location = await LocationFactory.create(ctx.db)
	// 	const user = await UserFactory.createWithAssignment(ctx.db, {
	// 		roleId: role!.id,
	// 		locationId: location!.id,
	// 		override: { isActive: false },
	// 	})

	// 	// Act
	// 	const res = await client.post('/auth/login', {
	// 		identifier: user!.email,
	// 		password: 'password123',
	// 	})

	// 	// Assert
	// 	expect(res.status).toBe(401)
	// })
})
