import type { LocationServiceModule } from '@/modules/location/service'

import { UserAssignmentService } from './assignment.service'
import { RoleService } from './role.service'
import { UserService } from './user.service'

export class IamServiceModule {
	public readonly role: RoleService
	public readonly userAssignment: UserAssignmentService
	public readonly user: UserService

	constructor(locationModule: LocationServiceModule) {
		this.role = new RoleService()
		this.userAssignment = new UserAssignmentService(locationModule.location, this.role)
		this.user = new UserService(this.userAssignment)
	}
}

export * from './role.service'
export * from './assignment.service'
export * from './user.service'
