import { Elysia } from 'elysia'

import type { IamModule } from '../index'
import { initUserAssignmentRoute } from './assignment.route'
import { initRoleRoute } from './role.route'
import { initUserRoute } from './user.route'

export function initIamRouteModule(m: IamModule) {
	const userRouter = initUserRoute(m.service.user, m.usecase.user)
	const roleRouter = initRoleRoute(m.service.role)
	const assignmentRouter = initUserAssignmentRoute(m.service.assignment)

	return new Elysia({ prefix: '/iam' }).use(userRouter).use(roleRouter).use(assignmentRouter)
}
