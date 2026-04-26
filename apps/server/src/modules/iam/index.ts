import { Elysia } from 'elysia'

import type { LocationServiceModule } from '@/modules/location'

import { initAssignmentRoute } from './assignment/assignment.route'
import { UserAssignmentService } from './assignment/assignment.service'
import { initRoleRoute } from './role/role.route'
import { RoleService } from './role/role.service'
import { initUserRoute } from './user/user.route'
import { UserService } from './user/user.service'

export interface IamServices {
	user: UserService
	role: RoleService
	assignment: UserAssignmentService
}

export class IamModule {
	public readonly service: IamServices

	constructor(private getExternalModules: () => { location: LocationServiceModule }) {
		const role = new RoleService()
		const assignment = new UserAssignmentService()
		const user = new UserService(
			undefined,
			() => role,
			() => assignment,
			() => this.getExternalModules().location.location,
		)

		this.service = { user, role, assignment }
	}

	initRouter() {
		return new Elysia({ prefix: '/iam' })
			.use(initUserRoute(this.service.user))
			.use(initRoleRoute(this.service.role))
			.use(initAssignmentRoute(this.service.assignment))
	}
}
