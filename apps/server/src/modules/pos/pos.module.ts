import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { CompanyService } from '@/modules/company/company.service.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { ComposedService } from '@/modules/menu/composed/composed.service.ts'
import type { ItemService } from '@/modules/menu/item/item.service.ts'
import type { PaymentMethodService } from '@/modules/payment-method/payment-method.service.ts'

import { createOrderModule } from './order/order.module.ts'
import { createPosRoute } from './pos.route.ts'
import { createShiftModule } from './shift/shift.module.ts'
import { createTableModule } from './table/table.module.ts'
import { createVoucherModule } from './voucher/voucher.module.ts'

// ─── Dependencies ───

export interface PosModuleDeps {
	locationService: LocationService
	paymentMethodService: PaymentMethodService
	companyService: CompanyService
	itemService: ItemService
	composedService: ComposedService
}

// ─── Module Factory ───

export function createPosModule(db: DbContext, cacheClient: CacheClient, deps: PosModuleDeps) {
	const voucher = createVoucherModule(db, cacheClient)
	const shift = createShiftModule(db, cacheClient, {
		locationService: deps.locationService,
	})
	const table = createTableModule(db, cacheClient, {
		locationService: deps.locationService,
	})
	const order = createOrderModule(db, cacheClient, {
		shiftService: shift.service,
		tableService: table.service,
		voucherService: voucher.service,
		paymentMethodService: deps.paymentMethodService,
		companyService: deps.companyService,
		itemService: deps.itemService,
		composedService: deps.composedService,
		locationService: deps.locationService,
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
