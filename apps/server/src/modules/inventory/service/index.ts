import type { MaterialServiceModule } from '@/modules/materials/service'

import { StockSummaryService } from './stock-summary.service'
import { StockTransactionService } from './stock-transaction.service'

export class InventoryServiceModule {
  public readonly transaction: StockTransactionService
  public readonly summary: StockSummaryService

  constructor(materialServiceModule: MaterialServiceModule) {
    this.transaction = new StockTransactionService(materialServiceModule.mLocation)
    this.summary = new StockSummaryService(materialServiceModule.mLocation)
  }
}

export { StockSummaryService } from './stock-summary.service'
export { StockTransactionService } from './stock-transaction.service'
