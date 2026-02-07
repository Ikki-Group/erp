import Elysia from 'elysia'

import type { IamService } from '../service'
import { buildIamRoleRoute } from './role.route'
import { userRoleAssignmentRoute } from './user-role-assignment.route'
import { userRoute } from './user.route'

export function buildIamRoute(s: IamService) {
  const userRouter = userRoute(s.users)
  const roleRouter = buildIamRoleRoute(s.roles)
  const userRoleAssignmentRouter = userRoleAssignmentRoute(s.userRoleAssignments)

  return new Elysia({ prefix: '/iam', tags: ['iam'] })
    .group('/users', (g) => g.use(userRouter))
    .group('/roles', (g) => g.use(roleRouter))
    .group('/user-role-assignments', (g) => g.use(userRoleAssignmentRouter))
}
