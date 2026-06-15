import Elysia from 'elysia'

import type { SessionServiceModule } from '@/modules/session'

import type { IamServiceModule } from '../iam'
import type { AuthLoginSchema, AuthOutputSchema } from './auth.contract'
import { initAuthRoute } from './auth.route'
import { AuthService } from './auth.service'

export type { AuthLoginSchema, AuthOutputSchema }

interface AuthServiceModuleDeps {
	session: SessionServiceModule
	iam: IamServiceModule
}

export class AuthServiceModule {
	public readonly auth: AuthService

	constructor(private readonly deps: AuthServiceModuleDeps) {
		this.auth = new AuthService(this.deps.iam, this.deps.session.session)
	}
}

export function createAuthRouteModule(s: AuthServiceModule) {
	return new Elysia({ prefix: '/auth' }).use(initAuthRoute(s.auth))
}
