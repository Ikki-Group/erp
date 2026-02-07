import Elysia from 'elysia'

import type { IamService } from '../service'
import { roleRoute } from './role.route'
import { userRoleAssignmentRoute } from './user-role-assignment.route'
import { userRoute } from './user.route'

export function initIamRoute(s: IamService) {
  const userRouter = userRoute(s.users)
  const roleRouter = roleRoute(s.roles)
  const userRoleAssignmentRouter = userRoleAssignmentRoute(s.userRoleAssignments)

  return new Elysia({ prefix: '/iam', tags: ['IAM'] })
    .group('/users', (g) => g.use(userRouter))
    .group('/roles', (g) => g.use(roleRouter))
    .group('/user-role-assignments', (g) => g.use(userRoleAssignmentRouter))
}
