import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { createAccountModule, type AccountModule } from './account/account.module'
import { createAccountRoute } from './account/account.route'
import { createExpenditureModule, type ExpenditureModule } from './expenditure/expenditure.module'
import { createExpenditureRoute } from './expenditure/expenditure.route'
import { createGeneralLedgerModule, type GeneralLedgerModule } from './general-ledger/general-ledger.module'
import { createGeneralLedgerRoute } from './general-ledger/general-ledger.route'

export class FinanceServiceModule {
	public readonly account: AccountModule
	public readonly journal: GeneralLedgerModule
	public readonly expenditure: ExpenditureModule

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.account = createAccountModule(db, cacheClient)
		this.journal = createGeneralLedgerModule(db, cacheClient)
		this.expenditure = createExpenditureModule(db, cacheClient, this.journal)
	}
}

export type FinanceModule = FinanceServiceModule

export function createFinanceRoute(m: FinanceModule) {
	return new Elysia({ prefix: '/finance' })
		.use(createAccountRoute(m.account))
		.use(createExpenditureRoute(m.expenditure))
		.use(createGeneralLedgerRoute(m.journal))
}

export function initFinanceRouteModule(s: FinanceServiceModule) {
	return createFinanceRoute(s)
}

export type { AccountModule, AccountModule as AccountService } from './account/account.module'
export type { ExpenditureModule, ExpenditureModule as ExpenditureService } from './expenditure/expenditure.module'
export type { GeneralLedgerModule } from './general-ledger/general-ledger.module'

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
export {
	JournalEntryDto,
	JournalEntryWithItemsDto,
	JournalItemDto,
	JournalEntryCreateDto,
	JournalEntryFilterDto,
} from './general-ledger/general-ledger.contract'
