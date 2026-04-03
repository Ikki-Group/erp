import { PurchaseOrderService } from './purchase-order.service'
import { GoodsReceiptService } from './goods-receipt.service'

export class PurchasingServiceModule {
  public purchaseOrder: PurchaseOrderService
  public goodsReceipt: GoodsReceiptService

  constructor() {
    this.purchaseOrder = new PurchaseOrderService()
    this.goodsReceipt = new GoodsReceiptService()
  }
}

export type { PurchaseOrderService } from './purchase-order.service'
export type { GoodsReceiptService } from './goods-receipt.service'
