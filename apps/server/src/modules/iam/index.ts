import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { LocationServiceModule } from '@/modules/location'

import { UserAssignmentRepo } from './assignment/assignment.repo'
import { createAssignmentRoute } from './assignment/assignment.route'
import { UserAssignmentService } from './assignment/assignment.service'
import { RoleRepo } from './role/role.repo'
import { createRoleRoute } from './role/role.route'
import { RoleService } from './role/role.service'
import { createUserReadRoute } from './user/user-read.route'
import { UserReadService } from './user/user-read.service'
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
	public readonly userRead: UserReadService

	constructor(db: DbClient, cacheClient: CacheClient, deps: IamServiceModuleDeps) {
		const roleRepo = new RoleRepo(db)
		const userRepo = new UserRepo(db)
		const assignmentRepo = new UserAssignmentRepo(db)

		this.role = new RoleService(roleRepo, cacheClient)
		this.assignment = new UserAssignmentService(assignmentRepo)
		this.user = new UserService(
			{
				location: deps.location,
				assignment: this.assignment,
				role: this.role,
			},
			userRepo,
			cacheClient,
		)
		this.userRead = new UserReadService({
			svc: {
				role: this.role,
				assignment: this.assignment,
				user: this.user,
				location: deps.location.location,
			},
		})
	}
}

export function createIamRouteModule(s: IamServiceModule) {
	return new Elysia({ prefix: '/iam' })
		.use(createRoleRoute(s.role))
		.use(createAssignmentRoute(s.assignment))
		.use(createUserRoute(s.user))
		.use(createUserReadRoute(s.userRead))
}

export * from './role/role.schema'
export * from './user/user.schema'
export * from './assignment/assignment.schema'
export * from './user/user-read.schema'

export type { RoleService } from './role/role.service'
export type { UserService } from './user/user.service'
export type { UserAssignmentService } from './assignment/assignment.service'
export type { UserReadService } from './user/user-read.service'
