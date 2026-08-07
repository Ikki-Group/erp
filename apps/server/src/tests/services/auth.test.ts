import type { AuthService } from '@/modules/auth/auth.service'

import { testCtx } from '../setup'
import { describe, test, expect, beforeAll } from 'bun:test'

const USER_OWNER = {
	identifier: 'admin@ikki.com',
	password: 'admin12345',
}

describe('services/auth', () => {
	let authSvc: AuthService

	beforeAll(async () => {
		authSvc = testCtx.m.auth
	})

	test('login success with valid credentials', async () => {
		const res = await authSvc.handleLogin(USER_OWNER)
		expect(res.user.hasGlobalAccess).toBe(true)
		expect(res.token).toBeTruthy()
	})
})
