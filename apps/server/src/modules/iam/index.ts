import type { LocationServiceModule } from '@/modules/location/service'

import { RoleRepo, UserAssignmentRepo, UserRepo } from './repo'
import { RoleService, UserAssignmentService, UserService } from './service'
import { AssignmentUsecases, RoleUsecases, UserUsecases } from './usecase'

export interface IamRepos {
	user: UserRepo
	role: RoleRepo
	assignment: UserAssignmentRepo
}

export interface IamServices {
	user: UserService
	role: RoleService
	assignment: UserAssignmentService
}

export interface IamUsecases {
	user: UserUsecases
	role: RoleUsecases
	assignment: AssignmentUsecases
}

export class IamModule {
	public readonly repo: IamRepos
	public readonly service: IamServices
	public readonly usecase: IamUsecases

	constructor(private getExternalModules: () => { location: LocationServiceModule }) {
		this.repo = {
			user: new UserRepo(),
			role: new RoleRepo(),
			assignment: new UserAssignmentRepo(),
		}

		this.service = {
			user: new UserService(this.repo.user),
			role: new RoleService(this.repo.role),
			assignment: new UserAssignmentService(this.repo.assignment),
		}

		this.usecase = {
			role: new RoleUsecases(this.service.role),
			assignment: new AssignmentUsecases(this.service.assignment),
			user: new UserUsecases(
				this.service.user,
				this.service.role,
				this.service.assignment,
				this.getExternalModules().location.location, // LocationMasterService
			),
		}
	}
}

export * from './dto'
export * from './router'
export * from './service'
export * from './usecase'
