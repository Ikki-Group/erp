import { Elysia } from 'elysia'

import type { IamService } from '../service'
import { buildIamAuthRoute } from './iam-auth.route'
import { buildIamRoleRoute } from './iam-role.route'
import { buildIamUserRoleAssignmentRoute } from './iam-user-role-assignment.route'
import { buildIamUserRoute } from './iam-user.route'

export function buildIamRoute(s: IamService) {
  const authRouter = buildIamAuthRoute(s)
  const userRouter = buildIamUserRoute(s)
  const roleRouter = buildIamRoleRoute(s.roles)
  const userRoleAssignmentRouter = buildIamUserRoleAssignmentRoute(s.userRoleAssignments)

  return new Elysia({ prefix: '/iam', tags: ['IAM'] })
    .use(authRouter)
    .group('/users', (g) => g.use(userRouter))
    .group('/roles', (g) => g.use(roleRouter))
    .group('/user-role-assignments', (g) => g.use(userRoleAssignmentRouter))
}
