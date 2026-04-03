import { HRService } from './hr.service'

export class HRServiceModule {
  public readonly hr: HRService

  constructor() {
    this.hr = new HRService()
  }
}
