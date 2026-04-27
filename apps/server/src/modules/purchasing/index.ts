import { Elysia } from 'elysia'

import type { InventoryServiceModule } from '@/modules/inventory'

import { initGoodsReceiptRoute } from './goods-receipt/goods-receipt.route'
import { GoodsReceiptService } from './goods-receipt/goods-receipt.service'
import { initPurchaseOrderRoute } from './purchase-order/purchase-order.route'
import { PurchaseOrderService } from './purchase-order/purchase-order.service'

export class PurchasingServiceModule {
	public purchaseOrder: PurchaseOrderService
	public goodsReceipt: GoodsReceiptService

	constructor(inventory: InventoryServiceModule) {
		this.purchaseOrder = new PurchaseOrderService()
		this.goodsReceipt = new GoodsReceiptService(inventory.transaction)
	}
}

export function initPurchasingRouteModule(s: PurchasingServiceModule) {
	return new Elysia({ prefix: '/purchasing' })
		.use(initPurchaseOrderRoute(s.purchaseOrder))
		.use(initGoodsReceiptRoute(s.goodsReceipt))
}

// Feature exports - Purchase Order
export * from './purchase-order/purchase-order.dto'
export * from './purchase-order/purchase-order.repo'
export * from './purchase-order/purchase-order.service'
export * from './purchase-order/purchase-order.route'

// Feature exports - Goods Receipt
export * from './goods-receipt/goods-receipt.dto'
export * from './goods-receipt/goods-receipt.repo'
export * from './goods-receipt/goods-receipt.service'
export * from './goods-receipt/goods-receipt.route'
