import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { SessionRepo } from './session.repo'
import { SessionService } from './session.service'

export type SessionModule = SessionService

export function createSessionModule(db: DbClient, cacheClient: CacheClient): SessionModule {
	const repo = new SessionRepo(db)
	return new SessionService(repo, cacheClient)
}
