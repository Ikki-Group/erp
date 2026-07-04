import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import type { JournalPostPort } from './expenditure.service'
import { ExpenditureRepo } from './expenditure.repo'
import { ExpenditureService } from './expenditure.service'

export type ExpenditureModule = ExpenditureService

export function createExpenditureModule(
	db: DbContext,
	cacheClient: CacheClient,
	journal: JournalPostPort,
): ExpenditureModule {
	const repo = new ExpenditureRepo(db)
	const expenditure = new ExpenditureService(journal, repo, cacheClient)

	return expenditure
}
