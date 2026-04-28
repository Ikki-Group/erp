import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { LocationServiceModule } from '@/modules/location'

import { initAssignmentRoute } from './assignment/assignment.route'
import { UserAssignmentService } from './assignment/assignment.service'
import { initRoleRoute } from './role/role.route'
import { RoleService } from './role/role.service'
import { UserRepo } from './user/user.repo'
import { initUserRoute } from './user/user.route'
import { UserService } from './user/user.service'

interface IamServiceModuleDeps {
	location: LocationServiceModule
}

export class IamServiceModule {
	public readonly role: RoleService
	public readonly assignment: UserAssignmentService
	public readonly user: UserService

	constructor(
		private db: DbClient,
		private readonly deps: IamServiceModuleDeps,
	) {
		this.role = new RoleService()
		this.assignment = new UserAssignmentService()
		this.user = new UserService(
			{
				location: this.deps.location,
				assignment: this.assignment,
				role: this.role,
			},
			new UserRepo(this.db),
		)
	}
}

export function initIamRouteModule(s: IamServiceModule) {
	return new Elysia({ prefix: '/iam' })
		.use(initRoleRoute(s.role))
		.use(initAssignmentRoute(s.assignment))
		.use(initUserRoute(s.user))
}
