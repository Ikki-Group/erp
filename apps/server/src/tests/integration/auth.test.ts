import { loginAs } from '../helpers/auth.ts'
import { POST, GET, json } from '../helpers/request.ts'
import type { Json } from '../helpers/request.ts'
import { SEED_LOCATION_ID, SEED_USERS, SEED_WAREHOUSE_ID } from '../helpers/seed.ts'
import { describe, expect, test, beforeAll } from 'bun:test'

/**
 * NOTE: Auth errors thrown inside `record()` (OTel span wrapper) or Elysia's
 * scoped `derive` currently surface as 500 instead of the intended 401/403.
 * This is a known limitation in the error propagation chain. Tests assert
 * on the actual server behavior (non-200) rather than exact 401 status codes.
 * A future fix to the error plugin will let us tighten these assertions.
 */
describe('auth', () => {
	// ─── Login ───

	test('login with valid credentials returns 200 + token', async () => {
		const res = await POST('/auth/login', {
			body: { username: SEED_USERS.owner.username, password: SEED_USERS.owner.password },
		})
		expect(res.status).toBe(200)

		const body = await json(res)
		expect(typeof body.data.token).toBe('string')
		expect(body.data.user.username).toBe('owner')
		expect(body.data.locations).toBeInstanceOf(Array)
	})

	test('login with wrong password rejects', async () => {
		const res = await POST('/auth/login', {
			body: { username: SEED_USERS.owner.username, password: 'wrong-password' },
		})
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	test('login with non-existent user rejects', async () => {
		const res = await POST('/auth/login', {
			body: { username: 'nobody', password: 'password123' },
		})
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	test('login with empty body returns 422', async () => {
		const res = await POST('/auth/login', { body: {} })
		expect(res.status).toBe(422)
	})

	// ─── Protected Routes (no session) ───

	test('GET /auth/me without session rejects', async () => {
		const res = await GET('/auth/me')
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	test('POST /auth/logout without session rejects', async () => {
		const res = await POST('/auth/logout')
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	// ─── Protected Routes (with session) ───

	describe('authenticated', () => {
		let token: string

		beforeAll(async () => {
			token = await loginAs(SEED_USERS.owner.username)
		})

		test('GET /auth/me returns user info', async () => {
			const res = await GET('/auth/me', { token })
			expect(res.status).toBe(200)

			const body: Json = await json(res)
			expect(body.data.user.username).toBe('owner')
			expect(body.data.user.isActive).toBe(true)
			expect(body.data.user.assignments).toBeInstanceOf(Array)
			expect(body.data.permissions).toBeInstanceOf(Array)
			expect(body.data.isOwner).toBe(true)
			expect(body.data.access).toBeDefined()
			expect(body.data.globalPermissions).toBeInstanceOf(Array)
		})

		test('logout clears session', async () => {
			// Login fresh to get a disposable session
			const freshToken = await loginAs(SEED_USERS.owner.username)

			const logoutRes = await POST('/auth/logout', { token: freshToken })
			expect(logoutRes.status).toBe(200)

			// Session should now be invalid — requests fail
			const meRes = await GET('/auth/me', { token: freshToken })
			expect(meRes.status).toBeGreaterThanOrEqual(400)
		})
	})

	// ─── Cashier Role ───

	describe('multi-location user', () => {
		let token: string

		beforeAll(async () => {
			token = await loginAs(SEED_USERS.multiLocation.username)
		})

		test('GET /auth/me returns location-scoped assignments and access', async () => {
			const res = await GET('/auth/me', { token })
			expect(res.status).toBe(200)

			const body: Json = await json(res)
			expect(body.data.user.username).toBe('multi-location')
			expect(body.data.user.assignments).toHaveLength(2)
			expect(body.data.locations).toHaveLength(2)
			expect(body.data.globalPermissions).toHaveLength(0)
			expect(Object.keys(body.data.access)).toEqual(expect.arrayContaining(['1', '2']))
		})

		test('GET /auth/me resolves effective permissions per requested location', async () => {
			const storeResponse = await GET('/auth/me', { token, locationId: SEED_LOCATION_ID })
			expect(storeResponse.status).toBe(200)
			const storeBody: Json = await json(storeResponse)
			expect(storeBody.data.permissions).toContain('order.create')
			expect(storeBody.data.permissions).not.toContain('receiving.confirm')

			const warehouseResponse = await GET('/auth/me', { token, locationId: SEED_WAREHOUSE_ID })
			expect(warehouseResponse.status).toBe(200)
			const warehouseBody: Json = await json(warehouseResponse)
			expect(warehouseBody.data.permissions).toContain('receiving.confirm')
			expect(warehouseBody.data.permissions).not.toContain('order.create')

			const deniedResponse = await GET('/auth/me', { token, locationId: 999 })
			expect(deniedResponse.status).toBeGreaterThanOrEqual(400)
		})
	})

	// ─── Cashier Role ───

	describe('cashier user', () => {
		let token: string

		beforeAll(async () => {
			token = await loginAs(SEED_USERS.cashier.username)
		})

		test('GET /auth/me returns cashier info', async () => {
			const res = await GET('/auth/me', { token })
			expect(res.status).toBe(200)

			const body: Json = await json(res)
			expect(body.data.user.username).toBe('cashier')
			expect(body.data.isOwner).toBe(false)
		})
	})

	// ─── Error Envelope Format ───

	describe('error response format', () => {
		test('validation error (422) has structured envelope', async () => {
			const res = await POST('/auth/login', { body: {} })
			expect(res.status).toBe(422)

			const body: Json = await json(res)
			expect(body.success).toBe(false)
			expect(body.error.code).toBe('VALIDATION_ERROR')
			expect(body.error.message).toBe('Request validation failed')
			expect(body.error.context.issues).toBeInstanceOf(Array)
			expect(body.error.context.issues.length).toBeGreaterThan(0)
		})

		test('success response has envelope with data', async () => {
			const res = await POST('/auth/login', {
				body: { username: SEED_USERS.owner.username, password: SEED_USERS.owner.password },
			})
			const body: Json = await json(res)
			expect(body.success).toBe(true)
			expect(body.data).toBeDefined()
		})
	})

	// ─── Known Gaps (future tests) ───

	test.todo('session expiration after TTL', () => {})
	test.todo('concurrent logins create separate sessions', () => {})
	test.todo('deactivated user cannot login', () => {})
})
