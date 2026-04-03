import type { InventoryServiceModule } from '@/modules/inventory'
import { PurchaseOrderService } from './purchase-order.service'
import { GoodsReceiptService } from './goods-receipt.service'

export class PurchasingServiceModule {
  public purchaseOrder: PurchaseOrderService
  public goodsReceipt: GoodsReceiptService

  constructor(inventory: InventoryServiceModule) {
    this.purchaseOrder = new PurchaseOrderService()
    this.goodsReceipt = new GoodsReceiptService(inventory.transaction)
  }
}

export type { PurchaseOrderService } from './purchase-order.service'
export type { GoodsReceiptService } from './goods-receipt.service'
