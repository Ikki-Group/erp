import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { MokaConfigurationRepo } from './configuration.repo'
import { MokaConfigurationService } from './configuration.service'

export type MokaConfigurationModule = MokaConfigurationService

export function createMokaConfigurationModule(db: DbClient, cacheClient: CacheClient): MokaConfigurationModule {
	const repo = new MokaConfigurationRepo(db)
	return new MokaConfigurationService(repo, cacheClient)
}
