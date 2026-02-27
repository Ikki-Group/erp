import { Elysia } from 'elysia'

import { UnauthorizedError } from '@/lib/error/http'

import type { IamServiceModule, UserDetailDto } from '@/modules/iam'

class AuthContext {
  constructor(public user: UserDetailDto | null) {}

  get isAuthenticated(): boolean {
    return this.user !== null
  }

  get userId(): number {
    if (!this.isAuthenticated) throw new UnauthorizedError('Unauthorized', 'AUTH_UNAUTHORIZED')
    return this.user!.id
  }
}

interface ReturnAuthDerive {
  auth: AuthContext | null
}

export function createAuthPlugin(iamService: IamServiceModule) {
  return new Elysia({ name: 'auth-plugin' })
    .derive(async ({ request }) => {
      let auth: AuthContext = new AuthContext(null)
      let token = request.headers.get('authorization')

      if (token) {
        token = token.startsWith('Bearer ') ? token.slice(7) : token
        const user = await iamService.auth.verifyToken(token)
        auth = new AuthContext(user)
      }

      return {
        auth,
      } satisfies ReturnAuthDerive
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
  })
  .as('global')
