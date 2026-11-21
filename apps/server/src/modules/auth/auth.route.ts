import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rateLimitPlugin } from '@/server/plugins/rate-limit.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { SESSION_MAX_AGE_SECONDS } from '@/shared/config/index.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, z } from '@/shared/schema/index.ts'

import { UserChangePasswordDto, UserProfileUpdateDto } from '@/modules/iam'
import type { UserService } from '@/modules/iam/user/user.service.ts'

import {
	LoginDto,
	LoginResponseDto,
	MeResponseDto,
	PasswordChangeResultDto,
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

export function createAuthRoute(service: AuthService, userService: UserService) {
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

			// ─── Self-service account (auth required) ───

			.put(
				'/profile',
				async ({ body, actor }) => res.ok(await userService.handleUpdateProfile(body, actor)),
				{
					body: UserProfileUpdateDto,
					response: zRes.ok(EntityRefDto),
					permission: 'auth.profile.update',
					detail: {
						summary: 'Update my profile',
						description:
							'Changes the caller’s own name and email. Username, status and assignments are untouched; the email must be unique.',
					},
				},
			)
			.post(
				'/password',
				async ({ body, auth, actor }) =>
					res.ok(await service.handleChangePassword(auth, body, actor)),
				{
					body: UserChangePasswordDto,
					response: zRes.ok(PasswordChangeResultDto),
					permission: 'auth.password.change',
					detail: {
						summary: 'Change my password',
						description:
							'Requires the current password (wrong → 400 INVALID_CURRENT_PASSWORD). Revokes every other session of the caller and keeps the current one.',
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
