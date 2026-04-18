import { AccountService } from './account.service'
import { GeneralLedgerService } from './general-ledger.service'
import { ExpenditureService } from './expenditure.service'

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

export * from './account.service'
export * from './general-ledger.service'
export * from './expenditure.service'
