import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import type { LocationModule } from '@/modules/location'

import { UserAssignmentRepo } from './assignment/assignment.repo'
import { UserAssignmentService } from './assignment/assignment.service'
import { IamComposedRepo } from './composed/composed.repo'
import { IamComposedService } from './composed/composed.service'
import { RoleRepo } from './role/role.repo'
import { RoleService } from './role/role.service'
import { UserRepo } from './user/user.repo'
import { UserService } from './user/user.service'

interface Deps {
	location: LocationModule
}

export interface IamModule {
	role: RoleService
	assignment: UserAssignmentService
	user: UserService
	composed: IamComposedService
}

export function createIamModule(db: DbContext, cacheClient: CacheClient, deps: Deps): IamModule {
	const roleRepo = new RoleRepo(db)
	const userRepo = new UserRepo(db)
	const assignmentRepo = new UserAssignmentRepo(db)
	const composedRepo = new IamComposedRepo(db)

	const role = new RoleService(roleRepo, cacheClient)
	const assignment = new UserAssignmentService(assignmentRepo, cacheClient)
	const user = new UserService(
		{
			location: deps.location,
			assignment,
			role,
		},
		userRepo,
		cacheClient,
	)
	const composed = new IamComposedService(
		{
			role,
			assignment,
			user,
			location: deps.location,
		},
		composedRepo,
	)

	return {
		role,
		assignment,
		user,
		composed,
	}
}
