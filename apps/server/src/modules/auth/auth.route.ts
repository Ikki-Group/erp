import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'

import { LoginDto, LoginResponseDto, MeResponseDto } from './auth.contract.ts'
import type { AuthService } from './auth.service.ts'

// ─── Route Factory ───

export function createAuthRoute(service: AuthService) {
	return (
		new Elysia({ prefix: '/auth', tags: ['auth'] })
			// ─── Login (public — no auth required) ───
			.post(
				'/login',
				async ({ body }) => {
					const result = await service.handleLogin(body)
					return res.ok(result.response)
				},
				{
					body: LoginDto,
					response: zRes.ok(LoginResponseDto),
				},
			)

			// ─── Logout (auth required) ───

			.use(authPlugin)
			.use(rbac)
			.post(
				'/logout',
				async ({ auth }) => {
					await service.handleLogout(auth.sessionId)
					return res.noData()
				},
				{ response: zRes.noData, permission: 'auth.logout' },
			)

			// ─── Me (auth required) ───

			.get(
				'/me',
				async ({ auth }) => {
					const result = await service.handleMe(auth)
					return res.ok(result)
				},
				{ response: zRes.ok(MeResponseDto), permission: 'auth.me' },
			)
	)
}
