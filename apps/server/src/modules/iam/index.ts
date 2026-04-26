import { Elysia } from 'elysia'

import type { LocationServiceModule } from '@/modules/location/service'

import { UserAssignmentService } from './assignment/assignment.service'
import { initAssignmentRoute } from './assignment/assignment.route'
import { RoleService } from './role/role.service'
import { initRoleRoute } from './role/role.route'
import { UserService } from './user/user.service'
import { initUserRoute } from './user/user.route'

export interface IamServices {
	user: UserService
	role: RoleService
	assignment: UserAssignmentService
}

/**
 * IamModule — public API for external module consumption.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ IMPORT GUIDE — iam module                                       │
 * │                                                                 │
 * │ External modules SHOULD import:                                 │
 * │   IamModule, IamServices  →  '@/modules/iam'                   │
 * │   User DTOs               →  '@/modules/iam/user/user.dto'     │
 * │   Role DTOs               →  '@/modules/iam/role/role.dto'     │
 * │   Assignment DTOs         →  '@/modules/iam/assignment/...'    │
 * │   Specific service type   →  '@/modules/iam/user/user.service' │
 * │                                                                 │
 * │ External modules MUST NOT:                                      │
 * │   import repo classes directly                                  │
 * └─────────────────────────────────────────────────────────────────┘
 */
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
