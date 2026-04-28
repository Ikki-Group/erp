import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { AccountRepo } from './account/account.repo'
import { initAccountRoute } from './account/account.route'
import { AccountService } from './account/account.service'
import { ExpenditureRepo } from './expenditure/expenditure.repo'
import { initExpenditureRoute } from './expenditure/expenditure.route'
import { ExpenditureService } from './expenditure/expenditure.service'
import { GeneralLedgerRepo } from './general-ledger/general-ledger.repo'
import { initGeneralLedgerRoute } from './general-ledger/general-ledger.route'
import { GeneralLedgerService } from './general-ledger/general-ledger.service'

export class FinanceServiceModule {
	public account: AccountService
	public journal: GeneralLedgerService
	public expenditure: ExpenditureService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const accountRepo = new AccountRepo(this.db, this.cacheClient)
		this.account = new AccountService(accountRepo)

		const glRepo = new GeneralLedgerRepo(this.db, this.cacheClient)
		this.journal = new GeneralLedgerService(glRepo)

		const expenditureRepo = new ExpenditureRepo(this.db, this.cacheClient)
		this.expenditure = new ExpenditureService(this.db, this.journal, expenditureRepo)
	}
}

export function initFinanceRouteModule(s: FinanceServiceModule) {
	return new Elysia({ prefix: '/finance' })
		.use(initAccountRoute(s.account))
		.use(initExpenditureRoute(s.expenditure))
		.use(initGeneralLedgerRoute(s.journal))
}

// Feature exports - Account
export * from './account/account.dto'
export * from './account/account.repo'
export * from './account/account.service'
export * from './account/account.route'

// Feature exports - Expenditure
export * from './expenditure/expenditure.dto'
export * from './expenditure/expenditure.repo'
export * from './expenditure/expenditure.service'
export * from './expenditure/expenditure.route'

// Feature exports - General Ledger
export * from './general-ledger/general-ledger.repo'
export * from './general-ledger/general-ledger.service'
export * from './general-ledger/general-ledger.route'
