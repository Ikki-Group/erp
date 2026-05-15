import Elysia from 'elysia'

import type { SessionServiceModule } from '@/modules/session'

import type { UserService } from '../iam'
import { initAuthRoute } from './auth.route'
import type { AuthLoginSchema, AuthOutputSchema } from './auth.schema'
import { AuthService } from './auth.service'

export type { AuthLoginSchema, AuthOutputSchema }

interface AuthServiceModuleDeps {
	session: SessionServiceModule
	user: UserService
}

export class AuthServiceModule {
	public readonly auth: AuthService

	constructor(private readonly deps: AuthServiceModuleDeps) {
		this.auth = new AuthService(this.deps.user, this.deps.session.session)
	}
}

export function createAuthRouteModule(s: AuthServiceModule) {
	return new Elysia({ prefix: '/auth' }).use(initAuthRoute(s.auth))
}
