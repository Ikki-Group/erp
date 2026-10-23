import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rateLimitPlugin } from '@/server/plugins/rate-limit.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { SESSION_MAX_AGE_SECONDS } from '@/shared/config/index.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { z } from '@/shared/schema/index.ts'

import {
	LoginDto,
	LoginResponseDto,
	MeResponseDto,
	TokenRequestDto,
	TokenResponseDto,
} from './auth.contract.ts'
import type { AuthService } from './auth.service.ts'
import {
	RevokeSessionResultDto,
	SessionDto,
	SessionIdQueryDto,
} from './session/session.contract.ts'

// ─── Route Factory ───

export function createAuthRoute(service: AuthService) {
	return (
		new Elysia({ prefix: '/auth', tags: ['Auth'] })
			.use(rateLimitPlugin({ name: 'auth-login' }))
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
					rateLimit: true,
					response: zRes.ok(LoginResponseDto),
					detail: {
						summary: 'Log in',
						description: 'Returns a session token plus the user and their locations.',
					},
				},
			)
			// OAuth2 password grant so API clients (the docs' Authorize button, Postman, …)
			// can log in themselves. Same session as /login, standard OAuth2 shape.
			.post(
				'/token',
				async ({ body, headers }) => {
					const { response } = await service.handleLogin(body, {
						userAgent: headers['user-agent'],
						ipAddress: headers['x-forwarded-for'],
					})
					return {
						access_token: response.token,
						token_type: 'Bearer' as const,
						expires_in: SESSION_MAX_AGE_SECONDS,
					}
				},
				{
					parse: 'urlencoded',
					body: TokenRequestDto,
					rateLimit: true,
					response: TokenResponseDto,
					detail: {
						summary: 'Get an access token (OAuth2 password grant)',
						description:
							'Form-encoded `grant_type=password&username=…&password=…`. Used by **Authorize** in these docs.',
					},
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
				{
					response: zRes.noData,
					permission: 'auth.logout',
					detail: {
						summary: 'Log out',
						description: 'Revokes the current session only; other devices stay signed in.',
					},
				},
			)

			// ─── Me (auth required) ───

			.get(
				'/me',
				async ({ auth }) => {
					const result = await service.handleMe(auth)
					return res.ok(result)
				},
				{
					response: zRes.ok(MeResponseDto),
					permission: 'auth.me',
					detail: {
						summary: 'Get the current user',
						description:
							'Returns the user, their accessible locations and the permissions effective at the active location.',
					},
				},
			)

			// ─── Session management (auth required) ───

			.get('/sessions/list', async ({ auth }) => res.ok(await service.handleListSessions(auth)), {
				response: zRes.ok(z.array(SessionDto)),
				permission: 'auth.session.list',
				detail: {
					summary: 'List my active sessions',
					description: 'The session making the request is flagged as current.',
				},
			})
			.delete(
				'/sessions/revoke',
				async ({ query, auth }) => {
					await service.handleRevokeSession(auth, query.id)
					return res.noData()
				},
				{
					query: SessionIdQueryDto,
					response: zRes.noData,
					permission: 'auth.session.revoke',
					detail: {
						summary: 'Revoke one of my sessions',
						description: 'Only sessions belonging to the caller can be revoked.',
					},
				},
			)
			.delete(
				'/sessions/revoke-others',
				async ({ auth }) => res.ok(await service.handleRevokeOtherSessions(auth)),
				{
					response: zRes.ok(RevokeSessionResultDto),
					permission: 'auth.session.revoke',
					detail: {
						summary: 'Revoke all my other sessions',
						description: 'Keeps the current session and returns how many others were revoked.',
					},
				},
			)
	)
}
