import type { CacheClient } from '@/infra/cache'

import type { DbClient } from '@/infra/database'

import { SessionRepo } from './session.repo'
import type { SessionSchema, SessionPayloadSchema } from './session.schema'
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

export type { SessionSchema, SessionPayloadSchema }
export * from './session.service'
