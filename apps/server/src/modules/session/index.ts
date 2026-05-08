import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { SessionRepo } from './session.repo'
import { SessionService } from './session.service'

export class SessionServiceModule {
	public readonly session: SessionService

	constructor(
		private readonly db: DbClient,
		readonly cacheClient: CacheClient,
	) {
		const sessionRepo = new SessionRepo(this.db)
		this.session = new SessionService(sessionRepo, cacheClient)
	}
}
