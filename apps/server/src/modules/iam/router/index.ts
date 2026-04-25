import { Elysia } from 'elysia'

import type { IamUsecases } from '../index'
import { initUserAssignmentRoute } from './assignment.route'
import { initRoleRoute } from './role.route'
import { initUserRoute } from './user.route'

export function initIamRouteModule(usecases: IamUsecases) {
	const userRouter = initUserRoute(usecases.user)
	const roleRouter = initRoleRoute(usecases.role)
	const assignmentRouter = initUserAssignmentRoute(usecases.assignment)

	return new Elysia({ prefix: '/iam' }).use(userRouter).use(roleRouter).use(assignmentRouter)
}

export * from './user.route'
export * from './role.route'
export * from './assignment.route'
