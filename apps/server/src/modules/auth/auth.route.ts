import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { SESSION_COOKIE_NAME, SESSION_TTL_DAYS } from '@/shared/config/index.ts'
import { res } from '@/shared/http/response.ts'

import { LoginDto, SwitchLocationDto } from './auth.contract.ts'
import type { AuthService } from './auth.service.ts'

// ─── Cookie Helpers ───

const SESSION_MAX_AGE_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60

function isProduction(): boolean {
	return Bun.env['NODE_ENV'] === 'production'
}

// ─── Route Factory ───

export function createAuthRoute(service: AuthService) {
	return (
		new Elysia({ prefix: '/auth' })

			// ─── Login (public — no auth required) ───

			.post(
				'/login',
				async ({ body, cookie }) => {
					const result = await service.handleLogin(body)

					// Set session cookie
					cookie[SESSION_COOKIE_NAME]!.set({
						value: result.sessionId,
						httpOnly: true,
						secure: isProduction(),
						sameSite: 'lax',
						maxAge: SESSION_MAX_AGE_SECONDS,
						path: '/',
					})

					return res.ok(result.response)
				},
				{ body: LoginDto },
			)

			// ─── Logout (auth required) ───

			.use(authPluginMacro)
			.post('/logout', async ({ cookie }) => {
				const sessionCookie = cookie[SESSION_COOKIE_NAME]
				const sessionId = sessionCookie ? String(sessionCookie.value) : ''

				await service.handleLogout(sessionId)

				// Clear cookie
				cookie[SESSION_COOKIE_NAME]!.set({
					value: '',
					httpOnly: true,
					secure: isProduction(),
					sameSite: 'lax',
					maxAge: 0,
					path: '/',
				})

				return res.noData()
			})

			// ─── Switch Location (auth required) ───

			.post(
				'/switch-location',
				async ({ body, cookie, auth }) => {
					const sessionCookie = cookie[SESSION_COOKIE_NAME]
					const sessionId = sessionCookie ? String(sessionCookie.value) : ''
					const result = await service.handleSwitchLocation(sessionId, body.locationId, auth.userId)
					return res.ok(result)
				},
				{ body: SwitchLocationDto },
			)

			// ─── Me (auth required) ───

			.get('/me', async ({ auth }) => {
				const result = await service.handleMe(auth)
				return res.ok(result)
			})
	)
}
