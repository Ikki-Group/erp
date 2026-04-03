import { PurchaseOrderService } from './purchase-order.service'

export class PurchasingServiceModule {
  public purchaseOrder: PurchaseOrderService

  constructor() {
    this.purchaseOrder = new PurchaseOrderService()
  }
}

export type { PurchaseOrderService } from './purchase-order.service'
