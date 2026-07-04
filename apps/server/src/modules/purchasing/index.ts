import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { InventoryServiceModule } from '@/modules/inventory'

import { GoodsReceiptRepo } from './goods-receipt.repo'
import { initGoodsReceiptRoute } from './goods-receipt.route'
import { GoodsReceiptService } from './goods-receipt.service'
import { createPurchaseOrderModule, type PurchaseOrderModule } from './purchase-order.module'
import { createPurchaseOrderRoute } from './purchase-order.route'

export type {
	PurchaseOrderDto,
	PurchaseOrderSelectDto,
	PurchaseOrderCreateDto,
	PurchaseOrderUpdateDto,
	PurchaseOrderFilterDto,
	PurchaseOrderApproveDto,
	PurchaseOrderRejectDto,
	PurchaseOrderSubmitForApprovalDto,
} from './purchase-order.contract'
export { PurchaseOrderStatusEnum, type PurchaseOrderStatus } from './purchase-order.contract'
export type { IPurchaseOrderRepo } from './purchase-order.repo'
export type { PurchaseOrderModule } from './purchase-order.module'

export {
	GoodsReceiptNoteDto,
	GoodsReceiptNoteCreateDto,
	GoodsReceiptNoteUpdateDto,
	GoodsReceiptNoteFilterDto,
	GoodsReceiptStatusEnum,
	type GoodsReceiptStatus,
} from './goods-receipt.contract'
export type { GoodsReceiptService } from './goods-receipt.service'

export interface PurchasingDeps {
	location: { getById: (id: number) => Promise<{ id: number; name: string } | undefined> }
	supplier: { getById: (id: number) => Promise<{ id: number; name: string } | undefined> }
	material: { getById: (id: number) => Promise<{ id: number; name: string } | undefined> }
}

export class PurchasingServiceModule {
	public readonly purchaseOrder: PurchaseOrderModule
	public readonly goodsReceipt: GoodsReceiptService

	constructor(
		db: DbClient,
		cacheClient: CacheClient,
		deps: PurchasingDeps,
		inventory: InventoryServiceModule,
	) {
		this.purchaseOrder = createPurchaseOrderModule(db, cacheClient, deps)

		const goodsReceiptRepo = new GoodsReceiptRepo(db)
		this.goodsReceipt = new GoodsReceiptService(
			goodsReceiptRepo,
			inventory.transaction,
			db,
			cacheClient,
		)
	}
}

export function initPurchasingRouteModule(s: PurchasingServiceModule) {
	return new Elysia({ prefix: '/purchasing' })
		.use(createPurchaseOrderRoute(s.purchaseOrder))
		.use(initGoodsReceiptRoute(s.goodsReceipt))
}
