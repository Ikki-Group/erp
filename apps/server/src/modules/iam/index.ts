import { Elysia } from 'elysia'

import type { LocationServiceModule } from '@/modules/location'

import { initAssignmentRoute } from './assignment/assignment.route'
import { UserAssignmentService } from './assignment/assignment.service'
import { initRoleRoute } from './role/role.route'
import { RoleService } from './role/role.service'
import { initUserRoute } from './user/user.route'
import { UserService } from './user/user.service'

export class IamServiceModule {
	public role: RoleService
	public assignment: UserAssignmentService
	public user: UserService

	constructor(private location: LocationServiceModule) {
		this.role = new RoleService()
		this.assignment = new UserAssignmentService()
		this.user = new UserService({
			role: this.role,
			assignment: this.assignment,
			location: this.location,
		})
	}
}

export function initIamRouteModule(s: IamServiceModule) {
	return new Elysia({ prefix: '/iam' })
		.use(initRoleRoute(s.role))
		.use(initAssignmentRoute(s.assignment))
		.use(initUserRoute(s.user))
}

export * from './assignment/assignment.dto'
export * from './assignment/assignment.repo'
export * from './assignment/assignment.service'

export * from './role/role.dto'
export * from './role/role.repo'
export * from './role/role.service'

export * from './user/user.dto'
export * from './user/user.repo'
export * from './user/user.service'
