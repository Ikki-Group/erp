import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { GeneralLedgerModule } from '@/modules/finance'

import { PayrollRepo } from './payroll.repo'
import { PayrollService, type AccountPayrollPort } from './payroll.service'

export type PayrollModule = PayrollService

export interface PayrollModuleDeps {
	account: AccountPayrollPort
	journal: GeneralLedgerModule
}

export function createPayrollModule(
	db: DbClient,
	cacheClient: CacheClient,
	deps: PayrollModuleDeps,
): PayrollModule {
	const repo = new PayrollRepo(db)
	return new PayrollService(deps.account, deps.journal, repo, db, cacheClient)
}
