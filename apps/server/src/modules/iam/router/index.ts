import { Elysia } from 'elysia'

import type { IamServiceModule } from '../service'
import { initIamAuthRoute } from './iam-auth.route'
import { initIamRoleRoute } from './iam-role.route'
import { initIamUserRoleAssignmentRoute } from './iam-user-role-assignment.route'
import { initIamUserRoute } from './iam-user.route'

export function initIamRouteModule(s: IamServiceModule) {
  const authRouter = initIamAuthRoute(s)
  const userRouter = initIamUserRoute(s)
  const roleRouter = initIamRoleRoute(s)
  const userRoleAssignmentRouter = initIamUserRoleAssignmentRoute(s)

  return new Elysia({ prefix: '/iam' })
    .group('/auth', { tags: ['auth'] }, (g) => g.use(authRouter))
    .group('/users', { tags: ['users'] }, (g) => g.use(userRouter))
    .group('/roles', { tags: ['roles'] }, (g) => g.use(roleRouter))
    .group('/user-role-assignments', { tags: ['user-role-assignments'] }, (g) => g.use(userRoleAssignmentRouter))
}
