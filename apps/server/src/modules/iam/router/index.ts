import { Elysia } from 'elysia'

import type { IamServiceModule } from '../service'

import { initAuthRoute } from './auth.route'
import { initRoleRoute } from './role.route'
import { initUserRoute } from './user.route'

export function initIamRouteModule(s: IamServiceModule) {
  const userRouter = initUserRoute(s)
  const roleRouter = initRoleRoute(s)
  const authRouter = initAuthRoute(s.auth)

  return new Elysia({ prefix: '/iam' }).use(userRouter).use(roleRouter).use(authRouter)
}
