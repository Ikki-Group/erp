import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { LocationService } from '@/modules/location/location.service.ts'

import { AssignmentRepo } from './assignment/assignment.repo.ts'
import { AssignmentService } from './assignment/assignment.service.ts'
import { ComposedRepo } from './composed/composed.repo.ts'
import { ComposedService } from './composed/composed.service.ts'
import { createIamRoute } from './iam.route.ts'
import { RoleRepo } from './role/role.repo.ts'
import { RoleService } from './role/role.service.ts'
import { UserRepo } from './user/user.repo.ts'
import { UserService } from './user/user.service.ts'

// ─── Dependencies ───

export interface IamModuleDeps {
	locationService: LocationService
}

// ─── Module Factory ───

export function createIamModule(db: DbContext, cacheClient: CacheClient, deps: IamModuleDeps) {
	// Repos
	const roleRepo = new RoleRepo(db)
	const userRepo = new UserRepo(db)
	const assignmentRepo = new AssignmentRepo(db)
	const composedRepo = new ComposedRepo(db)

	// Services
	const roleService = new RoleService(roleRepo, cacheClient)
	const userService = new UserService(userRepo, cacheClient)
	const assignmentService = new AssignmentService(assignmentRepo, {
		locationService: deps.locationService,
	})
	const composedService = new ComposedService(composedRepo)

	// Route
	const route = createIamRoute(roleService, userService, assignmentService, composedService)

	return { route, roleService, userService, assignmentService, composedService }
}
