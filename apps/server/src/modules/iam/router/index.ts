import { Elysia } from 'elysia'

import type { IamModule } from '../index'
import { initUserAssignmentRoute } from './assignment.route'
import { initRoleRoute } from './role.route'
import { initUserRoute } from './user.route'

export function initIamRouteModule(m: IamModule) {
	return new Elysia({ prefix: '/iam' })
		.use(initUserRoute(m.service.user))
		.use(initRoleRoute(m.service.role))
		.use(initUserAssignmentRoute(m.service.assignment))
}

export * from './user.route'
export * from './role.route'
export * from './assignment.route'
