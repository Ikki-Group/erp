import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient, DbContext } from '@/infra/database'

import { createAccountModule, type AccountModule } from './account/account.module'
import { createAccountRoute } from './account/account.route'
import { ExpenditureRepo } from './expenditure/expenditure.repo'
import { initExpenditureRoute } from './expenditure/expenditure.route'
import { ExpenditureService } from './expenditure/expenditure.service'
import { GeneralLedgerRepo } from './general-ledger/general-ledger.repo'
import { initGeneralLedgerRoute } from './general-ledger/general-ledger.route'
import { GeneralLedgerService } from './general-ledger/general-ledger.service'

export class FinanceServiceModule {
	public readonly account: AccountModule
	public readonly journal: GeneralLedgerService
	public readonly expenditure: ExpenditureService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		this.account = createAccountModule(db as DbContext, cacheClient)

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

export type FinanceModule = FinanceServiceModule

export function createFinanceRoute(m: FinanceModule) {
	return new Elysia({ prefix: '/finance' })
		.use(createAccountRoute(m.account))
		.use(initExpenditureRoute(m.expenditure))
		.use(initGeneralLedgerRoute(m.journal))
}

export function initFinanceRouteModule(s: FinanceServiceModule) {
	return createFinanceRoute(s)
}

export type { AccountModule, AccountModule as AccountService } from './account/account.module'
export type { GeneralLedgerService } from './general-ledger/general-ledger.service'

export {
	AccountDto,
	AccountCreateDto,
	AccountUpdateDto,
	AccountFilterDto,
	AccountTypeEnum,
	type AccountTypeEnum as AccountType,
} from './account/account.contract'
export {
	ExpenditureDto,
	ExpenditureCreateDto,
	ExpenditureUpdateDto,
	ExpenditureFilterDto,
	ExpenditureTypeEnum,
	ExpenditureStatusEnum,
	type ExpenditureTypeEnum as ExpenditureType,
	type ExpenditureStatusEnum as ExpenditureStatus,
} from './expenditure/expenditure.contract'
