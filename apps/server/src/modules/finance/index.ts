import { Elysia } from 'elysia'

import { initAccountRoute } from './account/account.route'
import { AccountService } from './account/account.service'
import { initExpenditureRoute } from './expenditure/expenditure.route'
import { ExpenditureService } from './expenditure/expenditure.service'
import { initGeneralLedgerRoute } from './general-ledger/general-ledger.route'
import { GeneralLedgerService } from './general-ledger/general-ledger.service'

export class FinanceServiceModule {
	public account: AccountService
	public journal: GeneralLedgerService
	public expenditure: ExpenditureService

	constructor() {
		this.account = new AccountService()
		this.journal = new GeneralLedgerService()
		this.expenditure = new ExpenditureService(this.journal)
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
