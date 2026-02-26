import { Elysia } from 'elysia'

import { createAuthPlugin } from '@/lib/elysia/auth-plugin'

import type { IamServiceModule } from '../service'

import { initAuthRoute } from './auth.route'
import { initRoleRoute } from './role.route'
import { initUserRoute } from './user.route'

export function initIamRouteModule(s: IamServiceModule) {
  const authRouter = initAuthRoute(s)
  const userRouter = initUserRoute(s)
  const roleRouter = initRoleRoute(s)

  return new Elysia({ prefix: '/iam' })
    .use(createAuthPlugin(s))
    .group('/auth', (g) => g.use(authRouter))
    .group('/user', (g) => g.use(userRouter))
    .group('/role', (g) => g.use(roleRouter))
}
