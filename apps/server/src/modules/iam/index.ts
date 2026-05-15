import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import type { LocationServiceModule } from '@/modules/location'

import { createAssignmentRoute } from './assignment.route'
import { UserAssignmentService } from './assignment.service'
import { RoleRepo } from './role.repo'
import { createRoleRoute } from './role.route'
import { RoleService } from './role.service'
import { UserRepo } from './user.repo'
import { createUserRoute } from './user.route'
import { UserService } from './user.service'

interface IamServiceModuleDeps {
	location: LocationServiceModule
}

export class IamServiceModule {
	public readonly role: RoleService
	public readonly assignment: UserAssignmentService
	public readonly user: UserService

	constructor(db: DbClient, cacheClient: CacheClient, deps: IamServiceModuleDeps) {
		const roleRepo = new RoleRepo(db)
		const userRepo = new UserRepo(db)

		this.role = new RoleService(roleRepo, cacheClient)
		this.assignment = new UserAssignmentService()
		this.user = new UserService(
			{
				location: deps.location,
				assignment: this.assignment,
				role: this.role,
			},
			userRepo,
			cacheClient,
		)
	}
}

export function createIamRouteModule(s: IamServiceModule) {
	return new Elysia({ prefix: '/iam' })
		.use(createRoleRoute(s.role))
		.use(createAssignmentRoute(s.assignment))
		.use(createUserRoute(s.user))
}

export * from './role.schema'
export * from './user.schema'
export * from './assignment.schema'
export type { RoleService } from './role.service'
export type { UserService } from './user.service'
export type { UserAssignmentService } from './assignment.service'
