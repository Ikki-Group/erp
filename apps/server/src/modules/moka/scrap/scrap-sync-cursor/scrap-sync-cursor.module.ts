import type { DbClient } from '@/infra/database'
import type { CacheClient } from '@/infra/cache'

import { MokaSyncCursorRepo } from './scrap-sync-cursor.repo'
import { MokaSyncCursorService } from './scrap-sync-cursor.service'

export type MokaSyncCursorModule = MokaSyncCursorService

export function createMokaSyncCursorModule(db: DbClient, cacheClient: CacheClient): MokaSyncCursorModule {
	const repo = new MokaSyncCursorRepo(db)
	return new MokaSyncCursorService(repo, cacheClient)
}
