import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { GeneralLedgerRepo } from './general-ledger.repo'
import { GeneralLedgerService } from './general-ledger.service'

export type GeneralLedgerModule = GeneralLedgerService

export function createGeneralLedgerModule(
	db: DbContext,
	cacheClient: CacheClient,
): GeneralLedgerModule {
	const repo = new GeneralLedgerRepo(db)
	const service = new GeneralLedgerService(repo, cacheClient)
	return service
}
