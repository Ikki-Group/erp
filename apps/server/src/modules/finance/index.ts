import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { createAccountModule, type AccountModule } from './account/account.module'
import { createAccountRoute } from './account/account.route'
import { createExpenditureModule, type ExpenditureModule } from './expenditure/expenditure.module'
import { createExpenditureRoute } from './expenditure/expenditure.route'
import { createGeneralLedgerModule, type GeneralLedgerModule } from './general-ledger/general-ledger.module'
import { createGeneralLedgerRoute } from './general-ledger/general-ledger.route'

export interface FinanceModule {
	account: AccountModule
	journal: GeneralLedgerModule
	expenditure: ExpenditureModule
}

export function createFinanceModule(db: DbClient, cacheClient: CacheClient): FinanceModule {
	const account = createAccountModule(db, cacheClient)
	const journal = createGeneralLedgerModule(db, cacheClient)
	const expenditure = createExpenditureModule(db, cacheClient, journal)

	return { account, journal, expenditure }
}

export function createFinanceRoute(m: FinanceModule) {
	return new Elysia({ prefix: '/finance' })
		.use(createAccountRoute(m.account))
		.use(createExpenditureRoute(m.expenditure))
		.use(createGeneralLedgerRoute(m.journal))
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
