import { HRService } from './hr.service'
import { PayrollService } from './payroll.service'
import type { FinanceServiceModule } from '../../finance/service'

export class HRServiceModule {
  public readonly hr: HRService
  public readonly payroll: PayrollService

  constructor(finance: FinanceServiceModule) {
    this.hr = new HRService()
    this.payroll = new PayrollService(finance.account, finance.journal)
  }
}
