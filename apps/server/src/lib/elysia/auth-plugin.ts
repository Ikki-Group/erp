import { Elysia } from 'elysia'

import { UnauthorizedError } from '@/lib/error/http'

import type { users } from '@/database/schema'

import type { IamServiceModule } from '@/modules/iam'

export const createAuthPlugin = (iamService: IamServiceModule) =>
  new Elysia({ name: 'auth-plugin' })
    .decorate('user', null as typeof users.$inferSelect | null)
    .derive({ as: 'global' }, async ({ request: { headers } }) => {
      const authorization = headers.get('authorization')
      if (!authorization) {
        return { user: null as typeof users.$inferSelect | null }
      }

      const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : authorization
      return { user: null }
      // try {
      //   const payload = iamService.auth.verifyToken(token)
      //   const user = await iamService.user.findById(payload.sub)

      //   if (!user || !user.isActive) {
      //     return { user: null as typeof users.$inferSelect | null }
      //   }

      //   return { user }
      // } catch {
      //   return { user: null as typeof users.$inferSelect | null }
      // }
    })
    .macro(({ onBeforeHandle }) => {
      return {
        isAuth(enabled: boolean) {
          if (!enabled) return
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onBeforeHandle(({ user }: any) => {
            if (!user) {
              throw new UnauthorizedError('Unauthorized', 'AUTH_UNAUTHORIZED')
            }
          })
        },
        hasPermission(permission: string | { permission: string; locationId?: number }) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onBeforeHandle(async ({ user, query }: any) => {
            // if (!user) {
            //   throw new UnauthorizedError('Unauthorized', 'AUTH_UNAUTHORIZED')
            // }
            // if (user.isRoot) return
            // let perm: string
            // let locId: number | undefined
            // if (typeof permission === 'string') {
            //   perm = permission
            //   locId = query.locationId ? Number(query.locationId) : undefined
            // } else {
            //   perm = permission.permission
            //   locId = permission.locationId
            // }
            // const userPermissions = await iamService.auth.getUserPermissions(user.id, locId)
            // if (!userPermissions.includes('*') && !userPermissions.includes(perm)) {
            //   throw new ForbiddenError(`Permission denied: ${perm}`, 'AUTH_FORBIDDEN')
            // }
          })
        },
      }
    })
