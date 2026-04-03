import { Elysia } from 'elysia'

import type { IamServiceModule } from '../service'
import { initRoleRoute } from './role.route'
import { initUserRoute } from './user.route'

export function initIamRouteModule(s: IamServiceModule) {
  const userRouter = initUserRoute(s.user)
  const roleRouter = initRoleRoute(s.role)

  return new Elysia({ prefix: '/iam' }).use(userRouter).use(roleRouter)
}
