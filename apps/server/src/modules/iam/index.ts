import type { Infra } from '@/shared/module.ts'

import type { LocationService } from '@/modules/location/index.ts'

import { AssignmentRepo } from './assignment/assignment.repo.ts'
import { AssignmentService } from './assignment/assignment.service.ts'
import { ComposedRepo } from './composed/composed.repo.ts'
import { ComposedService } from './composed/composed.service.ts'
import { createIamRoute } from './iam.route.ts'
import { RoleRepo } from './role/role.repo.ts'
import { RoleService } from './role/role.service.ts'
import { UserRepo } from './user/user.repo.ts'
import { UserService } from './user/user.service.ts'

export function createIamModule(
	infra: Infra,
	deps: { location: Pick<LocationService, 'getById'> },
) {
	const roleService = new RoleService({ ...infra, repo: new RoleRepo(infra.db) })
	const userService = new UserService({ ...infra, repo: new UserRepo(infra.db) })
	const assignmentService = new AssignmentService({
		...infra,
		repo: new AssignmentRepo(infra.db),
		location: deps.location,
	})
	const composedService = new ComposedService({ repo: new ComposedRepo(infra.db) })
	const route = createIamRoute(roleService, userService, assignmentService, composedService)
	return { route, userService, roleService, assignmentService, composedService }
}

export type { UserService }
