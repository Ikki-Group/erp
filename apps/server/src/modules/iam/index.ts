import type { LocationServiceModule } from '@/modules/location/service'

import { RoleService, UserAssignmentService, UserService } from './service'

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
			undefined, // use default repo
			() => role,
			() => assignment,
			() => this.getExternalModules().location.location,
		)

		this.service = { user, role, assignment }
	}
}

export * from './dto'
export * from './router'
export * from './service'
