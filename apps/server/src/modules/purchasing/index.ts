import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'

import type { DbClient } from '@/infra/database'

import type { InventoryServiceModule } from '@/modules/inventory'

import { GoodsReceiptRepo } from './goods-receipt.repo'
import { initGoodsReceiptRoute } from './goods-receipt.route'
import { GoodsReceiptService } from './goods-receipt.service'
import { PurchaseOrderRepo } from './purchase-order.repo'
import { initPurchaseOrderRoute } from './purchase-order.route'
import { PurchaseOrderService } from './purchase-order.service'

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

export {
	PurchaseOrderSchema,
	PurchaseOrderCreateSchema,
	PurchaseOrderUpdateSchema,
	PurchaseOrderFilterSchema,
	PurchaseOrderStatusEnum,
	type PurchaseOrderStatus,
} from './purchase-order.contract'
export {
	GoodsReceiptNoteSchema,
	GoodsReceiptNoteCreateSchema,
	GoodsReceiptNoteUpdateSchema,
	GoodsReceiptNoteFilterSchema,
	GoodsReceiptStatusEnum,
	type GoodsReceiptStatus,
} from './goods-receipt.contract'
export type { PurchaseOrderService } from './purchase-order.service'
export type { GoodsReceiptService } from './goods-receipt.service'
