import { Elysia } from 'elysia'

import type { LocationServiceModule } from '@/modules/location'

import { initAssignmentRoute } from './assignment/assignment.route'
import { UserAssignmentService } from './assignment/assignment.service'
import { initRoleRoute } from './role/role.route'
import { RoleService } from './role/role.service'
import { initUserRoute } from './user/user.route'
import { UserService } from './user/user.service'

export class IamServiceModule {
	public readonly role: RoleService
	public readonly assignment: UserAssignmentService
	public readonly user: UserService

	constructor(private readonly location: LocationServiceModule) {
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

