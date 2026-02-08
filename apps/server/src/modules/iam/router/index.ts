import { Elysia } from 'elysia'

import type { IamService } from '../service'
import { buildAuthRoute } from './auth.route'
import { buildIamRoleRoute } from './role.route'
import { buildIamUserRoleAssignmentRoute } from './user-role-assignment.route'
import { buildIamUserRoute } from './user.route'

export function buildIamRoute(s: IamService) {
  const authRouter = buildAuthRoute(s)
  const userRouter = buildIamUserRoute(s.users, s.userRoleAssignments)
  const roleRouter = buildIamRoleRoute(s.roles)
  const userRoleAssignmentRouter = buildIamUserRoleAssignmentRoute(s.userRoleAssignments)

  return new Elysia({ prefix: '/iam', tags: ['IAM'] })
    .use(authRouter)
    .group('/users', (g) => g.use(userRouter))
    .group('/roles', (g) => g.use(roleRouter))
    .group('/user-role-assignments', (g) => g.use(userRoleAssignmentRouter))
}
