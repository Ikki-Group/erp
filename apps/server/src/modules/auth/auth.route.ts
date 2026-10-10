import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
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

export function createAuthRoute(service: AuthService) {
	return new Elysia({ prefix: '/auth', tags: ['auth'] })
		.use(authGuard)
		.post(
			'/login',
			async ({ body, headers }) =>
				res.ok(
					await service.handleLogin(body, {
						userAgent: headers['user-agent'],
						ipAddress: headers['x-forwarded-for']?.split(',')[0]?.trim(),
					}),
				),
			{ body: LoginDto, response: zRes.ok(LoginResponseDto) },
		)
		.post(
			'/logout',
			async ({ auth }) => {
				await service.handleLogout(auth)
				return res.noData()
			},
			{ response: zRes.noData, permission: 'auth.logout' },
		)
		.get('/me', async ({ auth }) => res.ok(await service.handleMe(auth)), {
			response: zRes.ok(MeResponseDto),
			permission: 'auth.me',
		})
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
}
