import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { LocationServiceModule } from '@/modules/location'

import { UserAssignmentRepo } from './assignment/assignment.repo'
import { UserAssignmentService } from './assignment/assignment.service'
import { IamComposedRepo } from './composed/composed.repo'
import { IamComposedService } from './composed/composed.service'
import { RoleRepo } from './role/role.repo'
import { RoleService } from './role/role.service'
import { UserRepo } from './user/user.repo'
import { UserService } from './user/user.service'

interface IamServiceDeps {
	location: LocationServiceModule['location']
}

export class IamService {
	public readonly role: RoleService
	public readonly assignment: UserAssignmentService
	public readonly user: UserService
	public readonly composed: IamComposedService

	constructor(db: DbClient, cacheClient: CacheClient, deps: IamServiceDeps) {
		const roleRepo = new RoleRepo(db)
		const userRepo = new UserRepo(db)
		const assignmentRepo = new UserAssignmentRepo(db)
		const composedRepo = new IamComposedRepo(db)

		this.role = new RoleService(roleRepo, cacheClient)
		this.assignment = new UserAssignmentService(assignmentRepo, cacheClient)
		this.user = new UserService(
			{
				location: deps.location,
				assignment: this.assignment,
				role: this.role,
			},
			userRepo,
			cacheClient,
		)
		this.composed = new IamComposedService(
			{
				assignment: this.assignment,
				role: this.role,
				user: this.user,
				location: deps.location,
			},
			composedRepo,
		)
	}
}
