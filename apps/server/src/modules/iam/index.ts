import type { LocationServiceModule } from '@/modules/location/service'

import { RoleService, UserAssignmentService, UserService } from './service'
import { UserUsecases } from './usecase'

export interface IamServices {
	user: UserService
	role: RoleService
	assignment: UserAssignmentService
}

export interface IamUsecaseRegistry {
	user: UserUsecases
}

export class IamModule {
	public readonly service: IamServices
	public readonly usecase: IamUsecaseRegistry

	constructor(private getExternalModules: () => { location: LocationServiceModule }) {
		this.service = {
			user: new UserService(),
			role: new RoleService(),
			assignment: new UserAssignmentService(),
		}

		this.usecase = {
			user: new UserUsecases(
				this.service.user,
				this.service.role,
				this.service.assignment,
				this.getExternalModules().location.location,
			),
		}
	}
}

export * from './dto'
export * from './router'
export * from './service'
export * from './usecase'
