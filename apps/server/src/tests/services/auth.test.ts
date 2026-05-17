import type { AuthService } from '@/modules/auth/auth.service'

import { describe, beforeAll } from 'bun:test'

const USER_SUPERADMIN = {
	identifier: 'admin@ikki.com',
	password: 'admin12345',
}

describe('services/auth', () => {
	let authSvc: AuthService

	// beforeAll(async () => {
	// 	authSvc = testCtx.m.auth.auth
	// })

	// test('login success with valid credentials', async () => {
	// 	const res = await authSvc.login(USER_SUPERADMIN)
	// 	expect(res.user.isRoot).toBe(true)
	// 	expect(res.token).toBeTruthy()
	// })
})
