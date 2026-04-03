import { AccountService } from './account.service'
import { GeneralLedgerService } from './general-ledger.service'

export class FinanceServiceModule {
  public account: AccountService
  public journal: GeneralLedgerService

  constructor() {
    this.account = new AccountService()
    this.journal = new GeneralLedgerService()
  }
}

export * from './account.service'
export * from './general-ledger.service'
