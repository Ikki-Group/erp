import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import type { LocationServiceModule } from '@/modules/location'

import { createAssignmentRoute } from './assignment/assignment.route'
import { UserAssignmentService } from './assignment/assignment.service'
import { RoleRepo } from './role/role.repo'
import { createRoleRoute } from './role/role.route'
import { RoleService } from './role/role.service'
import { UserRepo } from './user/user.repo'
import { createUserRoute } from './user/user.route'
import { UserService } from './user/user.service'

interface IamServiceModuleDeps {
	location: LocationServiceModule
}

export class IamServiceModule {
	public readonly role: RoleService
	public readonly assignment: UserAssignmentService
	public readonly user: UserService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private readonly deps: IamServiceModuleDeps,
	) {
		const roleRepo = new RoleRepo(this.db)
		this.role = new RoleService(roleRepo, this.cacheClient)

		this.assignment = new UserAssignmentService()
		this.user = new UserService(
			{
				location: this.deps.location,
				assignment: this.assignment,
				role: this.role,
			},
			new UserRepo(this.db),
			this.cacheClient,
		)
	}
}

export function createIamRouteModule(s: IamServiceModule) {
	return new Elysia({ prefix: '/iam' })
		.use(createRoleRoute(s.role))
		.use(createAssignmentRoute(s.assignment))
		.use(createUserRoute(s.user))
}

export * from './role/role.schema'
export * from './user/user.schema'
export * from './assignment/assignment.schema'
export type { RoleService } from './role/role.service'
export type { UserService } from './user/user.service'
export type { UserAssignmentService } from './assignment/assignment.service'
