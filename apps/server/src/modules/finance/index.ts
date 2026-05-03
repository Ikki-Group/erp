import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { CacheClient } from '@/lib/cache'

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
	public readonly account: AccountService
	public readonly journal: GeneralLedgerService
	public readonly expenditure: ExpenditureService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const accountRepo = new AccountRepo(this.db)
		this.account = new AccountService(accountRepo, this.cacheClient)

		const glRepo = new GeneralLedgerRepo(this.db)
		this.journal = new GeneralLedgerService(glRepo, this.cacheClient)

		const expenditureRepo = new ExpenditureRepo(this.db)
		this.expenditure = new ExpenditureService(
			this.db,
			this.journal,
			expenditureRepo,
			this.cacheClient,
		)
	}
}

export function initFinanceRouteModule(s: FinanceServiceModule) {
	return new Elysia({ prefix: '/finance' })
		.use(initAccountRoute(s.account))
		.use(initExpenditureRoute(s.expenditure))
		.use(initGeneralLedgerRoute(s.journal))
}

export type { AccountService } from './account/account.service'
export type { GeneralLedgerService } from './general-ledger/general-ledger.service'
