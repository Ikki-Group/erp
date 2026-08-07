import { record } from '@elysiajs/opentelemetry'
import { context, trace } from '@opentelemetry/api'
import { Elysia } from 'elysia'

import { UnauthorizedError } from '@/shared/errors/http-error'
import { AuthContext, type AuthenticatedUser } from '@/shared/http/auth'

import type { AuthModule } from '@/modules/auth'
import type { UserDetailDto } from '@/modules/iam'

export { AuthContext } from '@/shared/http/auth'
export type { AuthenticatedUser } from '@/shared/http/auth'

/** Map the full UserDetailDto to the lean AuthenticatedUser shape. */
function toAuthenticatedUser(detail: UserDetailDto): AuthenticatedUser {
	return {
		id: detail.id,
		email: detail.email,
		username: detail.username,
		fullname: detail.fullname,
		isActive: detail.isActive,
		hasGlobalAccess: detail.hasGlobalAccess,
		createdAt: detail.createdAt,
		updatedAt: detail.updatedAt,
		createdBy: detail.createdBy,
		updatedBy: detail.updatedBy,
	}
}

export const authPluginMacro = new Elysia({ name: 'auth-macro' })
	.decorate('auth', new AuthContext(null))
	.macro({
		auth: (enabled: boolean) => ({
			resolve: ({ auth }): void => {
				if (enabled && !auth.isAuthenticated)
					throw new UnauthorizedError('Unauthorized', { code: 'AUTH_UNAUTHORIZED' })
			},
		}),
	})
	.as('global')

export function createAuthPlugin(authService: AuthModule) {
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

					const userDetail = await authService.verifyToken(token).catch(() => null)
					if (userDetail) {
						auth = new AuthContext(toAuthenticatedUser(userDetail))
						const userId = userDetail.id.toString()
						set.headers['X-User-Id'] = userId
						trace.getSpan(context.active())?.setAttribute('enduser.id', userId)
					}
				}

				return { auth }
			})
		})
		.as('global')
}
