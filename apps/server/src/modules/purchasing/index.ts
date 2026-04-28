import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import type { InventoryServiceModule } from '@/modules/inventory'

import { GoodsReceiptRepo } from './goods-receipt/goods-receipt.repo'
import { initGoodsReceiptRoute } from './goods-receipt/goods-receipt.route'
import { GoodsReceiptService } from './goods-receipt/goods-receipt.service'
import { PurchaseOrderRepo } from './purchase-order/purchase-order.repo'
import { initPurchaseOrderRoute } from './purchase-order/purchase-order.route'
import { PurchaseOrderService } from './purchase-order/purchase-order.service'

export class PurchasingServiceModule {
	public purchaseOrder: PurchaseOrderService
	public goodsReceipt: GoodsReceiptService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		inventory: InventoryServiceModule,
	) {
		const purchaseOrderRepo = new PurchaseOrderRepo(this.db, this.cacheClient)
		const goodsReceiptRepo = new GoodsReceiptRepo(this.db, this.cacheClient)

		this.purchaseOrder = new PurchaseOrderService(purchaseOrderRepo)
		this.goodsReceipt = new GoodsReceiptService(goodsReceiptRepo, inventory.transaction, this.db)
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
