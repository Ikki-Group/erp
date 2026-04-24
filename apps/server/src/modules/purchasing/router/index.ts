import Elysia from 'elysia'

import type { PurchasingServiceModule } from '../service'
import { initGoodsReceiptRoute } from './goods-receipt.route'
import { initPurchaseOrderRoute } from './purchase-order.route'

export function initPurchasingRouteModule(service: PurchasingServiceModule) {
	const purchaseOrderRouter = initPurchaseOrderRoute(service.purchaseOrder)
	const goodsReceiptRouter = initGoodsReceiptRoute(service.goodsReceipt)

	return new Elysia({ prefix: '/purchasing' }).use(purchaseOrderRouter).use(goodsReceiptRouter)
}
