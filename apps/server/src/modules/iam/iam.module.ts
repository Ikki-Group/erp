import type { CacheClient } from '@/infra/cache/index.ts'
import { cache } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import type { LocationApi } from '@/modules/location/index.ts'
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

function isLocationApi(api: Record<string, unknown> | undefined): api is LocationApi {
	const service = api?.service
	return Boolean(api && typeof service === 'object' && service !== null)
}

// ─── Dependencies ───

interface IamModuleDeps {
	locationService: LocationService
}

// ─── Module Factory ───

function createIamModule(db: DbContext, cacheClient: CacheClient, deps: IamModuleDeps) {
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

	return { route, roleService, userService, assignmentService, composedService, userRepo }
}

export interface IamApi extends Record<string, unknown> {
	route: ReturnType<typeof createIamRoute>
	roleService: RoleService
	userService: UserService
	assignmentService: AssignmentService
	composedService: ComposedService
	userRepo: UserRepo
}

export const iamModule: ModuleDescriptor = {
	name: 'iam',
	layer: 1,
	dependsOn: ['location'],
	create(ctx, deps) {
		if (!isLocationApi(deps.location?.api)) throw new Error('Location API dependency is missing')
		const built = createIamModule(ctx.db, cache, {
			locationService: deps.location.api.service,
		})
		return { route: built.route, api: built }
	},
}
