import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { SessionRepo } from './session.repo'
import { SessionService } from './session.service'

export type SessionModule = SessionService

export function createSessionModule(db: DbContext, cacheClient: CacheClient): SessionModule {
	const repo = new SessionRepo(db)
	return new SessionService(repo, cacheClient)
}
