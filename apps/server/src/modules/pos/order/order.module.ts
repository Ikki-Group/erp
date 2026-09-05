import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { CompanyApi } from '@/modules/company/index.ts'
import type { StockService } from '@/modules/inventory/stock/stock.service.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { ComposedService } from '@/modules/menu/composed/composed.service.ts'
import type { ItemService } from '@/modules/menu/item/item.service.ts'
import type { PaymentMethodService } from '@/modules/payment-method/payment-method.service.ts'
import type { RecipeService } from '@/modules/recipe/recipe.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import type { ShiftService } from '../shift/shift.service.ts'
import type { TableService } from '../table/table.service.ts'
import type { VoucherService } from '../voucher/voucher.service.ts'
import { OrderRepo } from './order.repo.ts'
import { createOrderRoute } from './order.route.ts'
import { OrderService } from './order.service.ts'

// ─── Dependencies ───

export interface OrderModuleDeps {
	shiftService: ShiftService
	tableService: TableService
	voucherService: VoucherService
	paymentMethodService: PaymentMethodService
	companyApi: CompanyApi
	itemService: ItemService
	composedService: ComposedService
	locationService: LocationService
	recipeService: RecipeService
	stockService: StockService
	uomService: UomService
	materialService: MaterialService
}

// ─── Module Factory ───

export function createOrderModule(db: DbContext, cacheClient: CacheClient, deps: OrderModuleDeps) {
	const repo = new OrderRepo(db)
	const service = new OrderService(repo, cacheClient, deps)
	const route = createOrderRoute(service)
	return { route, service }
}
