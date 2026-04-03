import { Elysia } from 'elysia'

import { UnauthorizedError } from '@/core/http/errors'

export interface AuthenticatedUser {
  id: number
  email: string
  username: string
  fullname: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: number
  updatedBy: number
}

export class AuthContext {
  constructor(public user: AuthenticatedUser | null) {}

  get isAuthenticated(): boolean {
    return this.user !== null
  }

  get userId(): number {
    if (!this.isAuthenticated) throw new UnauthorizedError('Unauthorized', 'AUTH_UNAUTHORIZED')
    return this.user!.id
  }
}

export const authPluginMacro = new Elysia({ name: 'auth-macro' })
  .decorate('auth', null! as AuthContext)
  .derive(({ auth }) => {
    if (!auth) return
    return { auth }
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
