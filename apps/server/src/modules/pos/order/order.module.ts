import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { CompanyApi } from '@/modules/company/index.ts'
import type { InventoryApi } from '@/modules/inventory/index.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { MenuApi } from '@/modules/menu/index.ts'
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
	uow: UnitOfWork
	audit: AuditPort
	events: EventBusPort
	shiftService: ShiftService
	tableService: TableService
	voucherService: VoucherService
	paymentMethodService: PaymentMethodService
	companyApi: CompanyApi
	menuItemDetail: MenuApi['itemDetail']
	locationService: LocationService
	recipeService: RecipeService
	inventoryApi: InventoryApi['stock']
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
