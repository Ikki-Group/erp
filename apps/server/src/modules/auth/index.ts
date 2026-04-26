import Elysia from 'elysia'

import type { UserService } from '../iam'
import { initAuthRoute } from './login/login.route'
import { LoginService } from './login/login.service'
import { SessionService } from './session/session.service'

export class AuthServiceModule {
	public readonly login: LoginService
	public readonly session: SessionService

	constructor(
		private svc: {
			user: UserService
		},
	) {
		this.session = new SessionService()
		this.login = new LoginService({
			user: this.svc.user,
			session: this.session,
		})
	}

	async verifyToken(token: string) {
		const session = await this.session.verifySession(token)
		if (!session) return null
		return this.svc.user.getById(session.userId)
	}
}

export function initAuthRouteModule(s: AuthServiceModule) {
	return new Elysia({ prefix: '/auth' }).use(initAuthRoute(s.login))
}

export * from './login/login.dto'
export * from './login/login.service'

export * from './session/session.dto'
export * from './session/session.repo'
export * from './session/session.service'
