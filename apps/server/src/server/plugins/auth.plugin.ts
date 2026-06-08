import { record } from '@elysiajs/opentelemetry'
import { context, trace } from '@opentelemetry/api'
import { Elysia } from 'elysia'

import { UnauthorizedError } from '@/shared/errors/http-error'
import { AuthContext } from '@/shared/http/auth'

import type { AuthServiceModule } from '@/modules/auth'

export { AuthContext } from '@/shared/http/auth'
export type { AuthenticatedUser } from '@/shared/http/auth'

export const authPluginMacro = new Elysia({ name: 'auth-macro' })
	.decorate('auth', new AuthContext(null))
	.macro({
		auth: (enabled: boolean) => ({
			resolve: ({ auth }): void => {
				// if (enabled && !auth.isAuthenticated)
				// 	throw new UnauthorizedError('Unauthorized', { code: 'AUTH_UNAUTHORIZED' })
			},
		}),
	})
	.as('global')

export function createAuthPlugin(authService: AuthServiceModule) {
	return new Elysia({ name: 'auth-plugin' })
		.derive(async ({ request, set }): Promise<{ auth: AuthContext }> => {
			// oxlint-disable-next-line typescript/require-await
			return record('auth-plugin.derive', async () => {
				let auth = new AuthContext(null)
				const rawToken = request.headers.get('authorization')

				if (rawToken) {
					// oxlint-disable-next-line require-unicode-regexp
					const token = rawToken.replace(/^Bearer\s+/i, '')
					if (!token) return { auth }

					const user = await authService.auth.verifyToken(token).catch(() => null)
					if (user) {
						auth = new AuthContext(user)
						const userId = user.id.toString()
						set.headers['X-User-Id'] = userId
						trace.getSpan(context.active())?.setAttribute('enduser.id', userId)
					}
				}

				return { auth }
			})
		})
		.as('global')
}
