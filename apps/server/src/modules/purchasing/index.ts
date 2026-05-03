import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { CacheClient } from '@/lib/cache'

import type { InventoryServiceModule } from '@/modules/inventory'

import { GoodsReceiptRepo } from './goods-receipt/goods-receipt.repo'
import { initGoodsReceiptRoute } from './goods-receipt/goods-receipt.route'
import { GoodsReceiptService } from './goods-receipt/goods-receipt.service'
import { PurchaseOrderRepo } from './purchase-order/purchase-order.repo'
import { initPurchaseOrderRoute } from './purchase-order/purchase-order.route'
import { PurchaseOrderService } from './purchase-order/purchase-order.service'

export class PurchasingServiceModule {
	public readonly purchaseOrder: PurchaseOrderService
	public readonly goodsReceipt: GoodsReceiptService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		inventory: InventoryServiceModule,
	) {
		const purchaseOrderRepo = new PurchaseOrderRepo(this.db)
		this.purchaseOrder = new PurchaseOrderService(purchaseOrderRepo, this.cacheClient)

		const goodsReceiptRepo = new GoodsReceiptRepo(this.db)
		this.goodsReceipt = new GoodsReceiptService(
			goodsReceiptRepo,
			inventory.transaction,
			this.db,
			this.cacheClient,
		)
	}
}

export function initPurchasingRouteModule(s: PurchasingServiceModule) {
	return new Elysia({ prefix: '/purchasing' })
		.use(initPurchaseOrderRoute(s.purchaseOrder))
		.use(initGoodsReceiptRoute(s.goodsReceipt))
}
