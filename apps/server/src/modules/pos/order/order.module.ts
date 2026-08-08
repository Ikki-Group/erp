import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { CompanyService } from '@/modules/company/company.service.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { ComposedService } from '@/modules/menu/composed/composed.service.ts'
import type { ItemService } from '@/modules/menu/item/item.service.ts'
import type { PaymentMethodService } from '@/modules/payment-method/payment-method.service.ts'

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
	companyService: CompanyService
	itemService: ItemService
	composedService: ComposedService
	locationService: LocationService
}

// ─── Module Factory ───

export function createOrderModule(db: DbContext, cacheClient: CacheClient, deps: OrderModuleDeps) {
	const repo = new OrderRepo(db)
	const service = new OrderService(repo, cacheClient, deps)
	const route = createOrderRoute(service)
	return { route, service }
}
