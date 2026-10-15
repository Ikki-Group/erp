import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import type { IamApi } from '@/modules/iam/index.ts'
import type { LocationApi } from '@/modules/location/index.ts'

import { createAuthRoute } from './auth.route.ts'
import { AuthService } from './auth.service.ts'
import { SessionRepo } from './session/session.repo.ts'

function isIamApi(api: Record<string, unknown> | undefined): api is IamApi {
	return (
		typeof api?.userRepo === 'object' &&
		typeof api.assignmentService === 'object' &&
		typeof api.composedService === 'object'
	)
}

function isLocationApi(api: Record<string, unknown> | undefined): api is LocationApi {
	return typeof api?.getById === 'function' && typeof api.service === 'object'
}

export const authModule: ModuleDescriptor = {
	name: 'auth',
	layer: 2,
	dependsOn: ['iam', 'location'],
	create(ctx, deps) {
		const iam = deps.iam?.api
		const location = deps.location?.api
		if (!isIamApi(iam) || !isLocationApi(location)) throw new Error('Auth dependencies are missing')
		const service = new AuthService({
			userRepo: iam.userRepo,
			assignmentService: iam.assignmentService,
			composedService: iam.composedService,
			locationService: location.service,
			sessionStore: ctx.sessionStore,
			sessionRepo: new SessionRepo(ctx.db),
		})
		return { route: createAuthRoute(service) }
	},
}
