import Elysia from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import type { UserService } from '../iam'
import { initAuthRoute } from './login/login.route'
import { LoginService } from './login/login.service'
import { SessionRepo } from './session/session.repo'
import { SessionService } from './session/session.service'

export class AuthServiceModule {
	public readonly login: LoginService
	public readonly session: SessionService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private svc: {
			user: UserService
		},
	) {
		const sessionRepo = new SessionRepo(this.db, this.cacheClient)
		this.session = new SessionService(sessionRepo, this.cacheClient)
		this.login = new LoginService({
			user: this.svc.user,
			session: this.session,
		})
	}

	async verifyToken(token: string) {
		const session = await this.session.verifySession(token)
		if (!session) return null
		return this.svc.user.getDetailById(session.userId)
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
