import type { Infra } from '@/shared/module.ts'

import { createAuthRoute } from './auth.route.ts'
import { AuthService } from './auth.service.ts'
import type { AuthServiceDeps } from './auth.service.ts'
import { SessionRepo } from './session/session.repo.ts'

export function createAuthModule(infra: Infra, deps: Omit<AuthServiceDeps, 'sessions'>) {
	const service = new AuthService({ ...deps, sessions: new SessionRepo(infra.db) })
	return { route: createAuthRoute(service) }
}
