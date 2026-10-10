import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { errorPlugin } from '@/server/plugins/error.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'

import { loginAs } from '../helpers/auth.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { describe, expect, test } from 'bun:test'

const guardedApp = new Elysia({ name: 'rbac-test-app' })
	.use(errorPlugin)
	.use(authGuard)
	.get('/guarded', () => ({ ok: true }), {
		permission: 't007.self-check',
	})

function requestWithToken(token: string): Promise<Response> {
	return guardedApp.handle(
		new Request('http://localhost/guarded', {
			headers: { authorization: `Bearer ${token}` },
		}),
	)
}

describe('rbac', () => {
	test('actorOf preserves the resolved authenticated user identity', () => {
		const auth: AuthContext = {
			sessionId: 'test-session-rbac',
			userId: 7,
			userName: 'Resolved User',
			locationId: 3,
			permissions: [],
			isOwner: false,
			globalPermissions: [],
			access: {},
			can: () => false,
			assertCan: () => {},
			allowedLocations: () => null,
		}

		expect(actorOf(auth)).toMatchObject({ id: 7, name: 'Resolved User', locationId: 3 })
	})

	test('guarded route allows owner and rejects a user without permission', async () => {
		const ownerResponse = await requestWithToken(await loginAs(SEED_USERS.owner.username))
		expect(ownerResponse.status).toBe(200)
		expect(await ownerResponse.json()).toEqual({ ok: true })

		const cashierResponse = await requestWithToken(await loginAs(SEED_USERS.cashier.username))
		expect(cashierResponse.status).toBe(403)

		const anonymous = await guardedApp.handle(new Request('http://localhost/guarded'))
		expect(anonymous.status).toBe(401)
		expect(await cashierResponse.json()).toMatchObject({
			success: false,
			error: { code: 'PERMISSION_DENIED' },
		})
	})
})
