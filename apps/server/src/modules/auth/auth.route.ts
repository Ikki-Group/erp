import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { z } from '@/shared/schema/index.ts'

import { LoginDto, LoginResponseDto, MeResponseDto } from './auth.contract.ts'
import type { AuthService } from './auth.service.ts'
import {
	RevokeSessionResultDto,
	SessionDto,
	SessionIdQueryDto,
} from './session/session.contract.ts'

// ─── Route Factory ───

export function createAuthRoute(service: AuthService) {
	return (
		new Elysia({ prefix: '/auth', tags: ['auth'] })
			// ─── Login (public — no auth required) ───
			.post(
				'/login',
				async ({ body, headers }) => {
					const result = await service.handleLogin(body, {
						userAgent: headers['user-agent'],
						ipAddress: headers['x-forwarded-for'],
					})
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
					await service.handleLogout(auth)
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

			// ─── Session management (auth required) ───

			.get('/sessions/list', async ({ auth }) => res.ok(await service.handleListSessions(auth)), {
				response: zRes.ok(z.array(SessionDto)),
				permission: 'auth.session.list',
			})
			.delete(
				'/sessions/revoke',
				async ({ query, auth }) => {
					await service.handleRevokeSession(auth, query.id)
					return res.noData()
				},
				{ query: SessionIdQueryDto, response: zRes.noData, permission: 'auth.session.revoke' },
			)
			.delete(
				'/sessions/revoke-others',
				async ({ auth }) => res.ok(await service.handleRevokeOtherSessions(auth)),
				{ response: zRes.ok(RevokeSessionResultDto), permission: 'auth.session.revoke' },
			)
	)
}
