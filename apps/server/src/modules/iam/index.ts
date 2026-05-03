import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { CacheClient } from '@/lib/cache'

import type { LocationServiceModule } from '@/modules/location'

import { initAssignmentRoute } from './assignment/assignment.route'
import { UserAssignmentService } from './assignment/assignment.service'
import { RoleRepo } from './role/role.repo'
import { initRoleRoute } from './role/role.route'
import { RoleService } from './role/role.service'
import { SessionRepo } from './session/session.repo'
import { initSessionRoute } from './session/session.route'
import { SessionService } from './session/session.service'
import { UserRepo } from './user/user.repo'
import { initUserRoute } from './user/user.route'
import { UserService } from './user/user.service'

interface IamServiceModuleDeps {
	location: LocationServiceModule
}

export class IamServiceModule {
	public readonly role: RoleService
	public readonly assignment: UserAssignmentService
	public readonly user: UserService
	public readonly session: SessionService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private readonly deps: IamServiceModuleDeps,
	) {
		const roleRepo = new RoleRepo(this.db)
		this.role = new RoleService(roleRepo, this.cacheClient)

		const sessionRepo = new SessionRepo(this.db)
		this.session = new SessionService(sessionRepo, this.cacheClient)

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

export function initIamRouteModule(s: IamServiceModule) {
	return new Elysia({ prefix: '/iam' })
		.use(initRoleRoute(s.role))
		.use(initAssignmentRoute(s.assignment))
		.use(initUserRoute(s.user))
		.use(initSessionRoute(s.session))
}

export { UserDto, UserDetailDto } from './user/user.dto'
export { SessionDto, SessionSelectDto } from './session/session.dto'
export { RoleDto, RoleCreateDto, RoleUpdateDto, RoleFilterDto } from './role/role.dto'
export type { UserService } from './user/user.service'
export type { SessionService } from './session/session.service'
export type { RoleService } from './role/role.service'
