import { Elysia } from 'elysia'

import { createAuthPlugin } from '@/lib/elysia/auth-plugin'

import type { IamServiceModule } from '../service'
import { initIamAuthRoute } from './iam-auth.route'
import { initIamRoleRoute } from './iam-role.route'
import { initIamUserRoleAssignmentRoute } from './iam-user-role-assignment.route'
import { initIamUserRoute } from './iam-user.route'

export function initIamRouteModule(service: IamServiceModule) {
  const authRouter = initIamAuthRoute(service)
  const userRouter = initIamUserRoute(service)
  const roleRouter = initIamRoleRoute(service)
  const userRoleAssignmentRouter = initIamUserRoleAssignmentRoute(service)

  return new Elysia({ prefix: '/iam' })
    .use(createAuthPlugin(service))
    .group('/auth', { tags: ['auth'] }, (g) => g.use(authRouter))
    .group('/users', { tags: ['users'] }, (g) => g.use(userRouter))
    .group('/roles', { tags: ['roles'] }, (g) => g.use(roleRouter))
    .group('/user-role-assignments', { tags: ['user-role-assignments'] }, (g) => g.use(userRoleAssignmentRouter))
}
