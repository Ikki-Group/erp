import { AccountService } from './account.service'

export class FinanceServiceModule {
  public account: AccountService

  constructor() {
    this.account = new AccountService()
  }
}

export * from './account.service'
