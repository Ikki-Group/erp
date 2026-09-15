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

import { createOrderModule } from './order/order.module.ts'
import { createPosRoute } from './pos.route.ts'
import { createShiftModule } from './shift/shift.module.ts'
import { createTableModule } from './table/table.module.ts'
import { createVoucherModule } from './voucher/voucher.module.ts'

// ─── Dependencies ───

export interface PosModuleDeps {
	uow: UnitOfWork
	audit: AuditPort
	events: EventBusPort
	locationService: LocationService
	paymentMethodService: PaymentMethodService
	companyApi: CompanyApi
	menuApi: MenuApi
	recipeService: RecipeService
	inventoryApi: InventoryApi['stock']
	uomService: UomService
	materialService: MaterialService
}

// ─── Module Factory ───

export function createPosModule(db: DbContext, cacheClient: CacheClient, deps: PosModuleDeps) {
	const voucher = createVoucherModule(db, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
	})
	const shift = createShiftModule(db, cacheClient, {
		locationService: deps.locationService,
		uow: deps.uow,
		audit: deps.audit,
	})
	const table = createTableModule(db, cacheClient, {
		locationService: deps.locationService,
		uow: deps.uow,
		audit: deps.audit,
	})
	const order = createOrderModule(db, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
		events: deps.events,
		shiftService: shift.service,
		tableService: table.service,
		voucherService: voucher.service,
		paymentMethodService: deps.paymentMethodService,
		companyApi: deps.companyApi,
		menuItemDetail: deps.menuApi.itemDetail,
		locationService: deps.locationService,
		recipeService: deps.recipeService,
		inventoryApi: deps.inventoryApi,
		uomService: deps.uomService,
		materialService: deps.materialService,
	})

	const route = createPosRoute({ voucher, shift, table, order })
	return {
		route,
		voucherService: voucher.service,
		shiftService: shift.service,
		tableService: table.service,
		orderService: order.service,
	}
}
