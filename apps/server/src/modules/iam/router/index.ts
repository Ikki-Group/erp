import { Elysia } from 'elysia'

import type { IamServiceModule } from '../service'
import { initRoleRoute } from './role.route'
import { initUserRoute } from './user.route'
import { initUserAssignmentRoute } from './assignment.route'

export function initIamRouteModule(s: IamServiceModule) {
  const userRouter = initUserRoute(s.user)
  const roleRouter = initRoleRoute(s.role)
  const assignmentRouter = initUserAssignmentRoute(s.userAssignment)

  return new Elysia({ prefix: '/iam' }).use(userRouter).use(roleRouter).use(assignmentRouter)
}
