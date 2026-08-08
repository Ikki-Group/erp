import type { sessionStore } from '@/infra/session/index.ts'

import type { AssignmentService } from '@/modules/iam/assignment/assignment.service.ts'
import type { IUserRepo } from '@/modules/iam/user/user.repo.ts'
import type { LocationService } from '@/modules/location/location.service.ts'

import { createAuthRoute } from './auth.route.ts'
import { AuthService } from './auth.service.ts'

// ─── Dependencies ───

export interface AuthModuleDeps {
	userRepo: IUserRepo
	assignmentService: AssignmentService
	locationService: LocationService
	sessionStore: typeof sessionStore
}

// ─── Module Factory ───

export function createAuthModule(deps: AuthModuleDeps) {
	const service = new AuthService(deps)
	const route = createAuthRoute(service)
	return { route }
}
