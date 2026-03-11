import { getCurrentSpan, record } from '@elysiajs/opentelemetry'
import { Elysia } from 'elysia'

import { UnauthorizedError } from '@/lib/error/http'

import type { UserOutputDto } from '@/modules/iam/dto/user.dto'
import type { IamServiceModule } from '@/modules/iam/service'

class AuthContext {
  constructor(public user: UserOutputDto | null) {}

  get isAuthenticated(): boolean {
    return this.user !== null
  }

  get userId(): number {
    if (!this.isAuthenticated) throw new UnauthorizedError('Unauthorized', 'AUTH_UNAUTHORIZED')
    return this.user!.id
  }
}

export function createAuthPlugin(iamService: IamServiceModule) {
  return new Elysia({ name: 'auth-plugin' })
    .derive(async ({ request, set }): Promise<{ auth: AuthContext }> => {
      return record('auth-plugin.derive', async () => {
        let auth: AuthContext = new AuthContext(null)
        let token = request.headers.get('authorization')

        if (token) {
          token = token.startsWith('Bearer ') ? token.slice(7) : token
          const user = await iamService.auth.verifyToken(token).catch(() => null)
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

export const authPluginMacro = new Elysia({ name: 'auth-plugin' })
  .decorate('auth', null! as AuthContext)
  .derive(({ auth }) => {
    if (!auth) return
    return {
      auth,
    }
  })
  .macro({
    isAuthenticated: (enabled: boolean) => ({
      resolve: ({ auth }) => {
        if (enabled && !auth.isAuthenticated) throw new UnauthorizedError('Unauthorized', 'AUTH_UNAUTHORIZED')
      },
    }),
    auth: (enabled: boolean) => ({
      resolve: ({ auth }) => {
        if (enabled && !auth.isAuthenticated) throw new UnauthorizedError('Unauthorized', 'AUTH_UNAUTHORIZED')
      },
    }),
  })
  .as('global')
