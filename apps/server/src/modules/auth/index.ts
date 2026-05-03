import Elysia from 'elysia'

import type { DbClient } from '@/core/database'

import type { CacheClient } from '@/lib/cache'

import type { UserService } from '../iam'

interface AuthServiceModuleDeps {
	user: UserService
}

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
		private readonly deps: AuthServiceModuleDeps,
	) {
		const sessionRepo = new SessionRepo(this.db)
		this.session = new SessionService(sessionRepo, this.cacheClient)
		this.login = new LoginService({
			user: this.deps.user,
			session: this.session,
		})
	}

	async verifyToken(token: string) {
		const session = await this.session.verifySession(token)
		if (!session) return null
		return this.deps.user.getDetailById(session.userId)
	}
}

export function initAuthRouteModule(s: AuthServiceModule) {
	return new Elysia({ prefix: '/auth' }).use(initAuthRoute(s.login))
}

export * from './login/login.dto'
export type { LoginService } from './login/login.service'

export * from './session/session.dto'
export type { SessionService } from './session/session.service'
