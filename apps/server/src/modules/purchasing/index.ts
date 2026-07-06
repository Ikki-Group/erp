import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { InventoryModule } from '@/modules/inventory'

import { createGoodsReceiptModule, type GoodsReceiptModule } from './goods-receipt.module'
import { createGoodsReceiptRoute } from './goods-receipt.route'
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
export type { IGoodsReceiptRepo } from './goods-receipt.repo'
export type { GoodsReceiptModule } from './goods-receipt.module'

export interface PurchasingDeps {
	location: { getById: (id: number) => Promise<{ id: number; name: string } | undefined> }
	supplier: { getById: (id: number) => Promise<{ id: number; name: string } | undefined> }
	material: { getById: (id: number) => Promise<{ id: number; name: string } | undefined> }
}

export interface PurchasingServiceModule {
	purchaseOrder: PurchaseOrderModule
	goodsReceipt: GoodsReceiptModule
}

export function createPurchasingServiceModule(
	db: DbClient,
	cacheClient: CacheClient,
	deps: PurchasingDeps,
	inventory: InventoryModule,
): PurchasingServiceModule {
	const purchaseOrder = createPurchaseOrderModule(db, cacheClient, deps)

	const goodsReceipt = createGoodsReceiptModule(db, cacheClient, {
		stockTransaction: inventory.transaction,
		purchaseOrder: {
			handleGetById: async (id: number) => {
				const po = await purchaseOrder.handleGetById(id)
				return { id: po.id, status: po.status }
			},
		},
	})

	return { purchaseOrder, goodsReceipt }
}

export function initPurchasingRouteModule(s: PurchasingServiceModule) {
	return new Elysia({ prefix: '/purchasing' })
		.use(createPurchaseOrderRoute(s.purchaseOrder))
		.use(createGoodsReceiptRoute(s.goodsReceipt))
}
