import { HRService } from './hr.service'
import { PayrollService } from './payroll.service'

export class HRServiceModule {
  public readonly hr: HRService
  public readonly payroll: PayrollService

  constructor() {
    this.hr = new HRService()
    this.payroll = new PayrollService()
  }
}
