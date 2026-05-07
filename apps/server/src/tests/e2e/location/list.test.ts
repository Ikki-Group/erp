// import { initModules } from '@/modules/_registry'

// import { UserFactory, RoleFactory, LocationFactory } from '@/tests/factories'
// import { createTestClient, type TestClient } from '@/tests/helpers/test-client'
// import { createTestContext, type TestContext } from '@/tests/helpers/test-db'
// import type { ApiResponse, AuthLoginResponse, LocationData } from '@/tests/helpers/test-types'
// import { describe, test, expect, beforeEach, afterEach } from 'bun:test'

// describe('GET /location/list', () => {
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

// 	test('returns paginated list of locations', async () => {
// 		// Arrange
// 		await LocationFactory.createList(ctx.db, 5)

// 		// Act
// 		const res = await client.withAuth(token).get('/location/list')
// 		const body = (await res.json()) as ApiResponse<LocationData[]>

// 		// Assert
// 		expect(res.status).toBe(200)
// 		expect(body.success).toBe(true)
// 		expect(body.data.length).toBeGreaterThanOrEqual(5)
// 		expect(body.meta).toBeDefined()
// 		expect(body.meta!.total).toBeGreaterThanOrEqual(5)
// 	})

// 	test('searches locations by name', async () => {
// 		// Arrange
// 		await LocationFactory.create(ctx.db, { name: 'Alpha Store' })
// 		await LocationFactory.create(ctx.db, { name: 'Beta Warehouse' })
// 		await LocationFactory.create(ctx.db, { name: 'Gamma Store' })

// 		// Act
// 		const res = await client.withAuth(token).get('/location/list?q=Alpha')
// 		const body = (await res.json()) as ApiResponse<LocationData[]>

// 		// Assert
// 		expect(res.status).toBe(200)
// 		expect(body.data.length).toBe(1)
// 		expect(body.data[0]!.name).toBe('Alpha Store')
// 	})

// 	test('filters by type', async () => {
// 		// Arrange
// 		await LocationFactory.create(ctx.db, { name: 'Store 1', type: 'store' })
// 		await LocationFactory.create(ctx.db, { name: 'Warehouse 1', type: 'warehouse' })

// 		// Act
// 		const res = await client.withAuth(token).get('/location/list?type=store')
// 		const body = (await res.json()) as ApiResponse<LocationData[]>

// 		// Assert
// 		expect(res.status).toBe(200)
// 		expect(body.data.every((l) => l.type === 'store')).toBe(true)
// 	})

// 	test('paginates results', async () => {
// 		// Arrange
// 		await LocationFactory.createList(ctx.db, 15)

// 		// Act
// 		const res = await client.withAuth(token).get('/location/list?page=1&limit=5')
// 		const body = (await res.json()) as ApiResponse<LocationData[]>

// 		// Assert
// 		expect(res.status).toBe(200)
// 		expect(body.data.length).toBe(5)
// 		expect(body.meta!.page).toBe(1)
// 		expect(body.meta!.limit).toBe(5)
// 	})

// 	test('returns 401 without authentication', async () => {
// 		// Act
// 		const res = await client.get('/location/list')

// 		// Assert
// 		expect(res.status).toBe(401)
// 	})
// })
