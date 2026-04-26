import { getCurrentSpan, record } from '@elysiajs/opentelemetry'
import { Elysia } from 'elysia'

import type { AuthServiceModule } from '@/modules/auth'

import { AuthContext } from './auth-macro'

export { AuthContext, authPluginMacro } from './auth-macro'

export function createAuthPlugin(authService: AuthServiceModule) {
	return new Elysia({ name: 'auth-plugin' })
		.derive(async ({ request, set }): Promise<{ auth: AuthContext }> => {
			return record('auth-plugin.derive', async () => {
				let auth: AuthContext = new AuthContext(null)
				let token = request.headers.get('authorization')

				if (token) {
					token = token.startsWith('Bearer ') ? token.slice(7) : token
					const user = await authService.verifyToken(token).catch(() => null)
					if (user) {
						auth = new AuthContext(user)
						set.headers['X-User-Id'] = user.id.toString()

						const span = getCurrentSpan()
						span?.setAttribute('enduser.id', user.id.toString())
					}
				}

				return { auth }
			})
		})
		.as('global')
}
