import { Elysia } from 'elysia'

import type { Infra } from '@/shared/module.ts'

import type { CompanyService } from '@/modules/company/index.ts'
import type { StockService } from '@/modules/inventory/index.ts'
import type { LocationService } from '@/modules/location/index.ts'
import type { MaterialService } from '@/modules/material/index.ts'
import type { ComposedService } from '@/modules/menu/index.ts'
import type { PaymentMethodService } from '@/modules/payment-method/index.ts'
import type { RecipeService } from '@/modules/recipe/index.ts'
import type { UomService } from '@/modules/uom/index.ts'

import { OrderRepo } from './order/order.repo.ts'
import { createOrderRoute } from './order/order.route.ts'
import { OrderService } from './order/order.service.ts'
import { ShiftRepo } from './shift/shift.repo.ts'
import { createShiftRoute } from './shift/shift.route.ts'
import { ShiftService } from './shift/shift.service.ts'
import { TableRepo } from './table/table.repo.ts'
import { createTableRoute } from './table/table.route.ts'
import { TableService } from './table/table.service.ts'
import { VoucherRepo } from './voucher/voucher.repo.ts'
import { createVoucherRoute } from './voucher/voucher.route.ts'
import { VoucherService } from './voucher/voucher.service.ts'

export function createPosModule(
	infra: Infra,
	deps: {
		location: Pick<LocationService, 'handleGetById'>
		paymentMethod: Pick<PaymentMethodService, 'handleByLocation'>
		company: Pick<CompanyService, 'getTaxRatePercent'>
		menu: Pick<ComposedService, 'handleDetail'>
		recipe: Pick<RecipeService, 'getActiveByMenuItemId' | 'getLinesByRecipeId'>
		stock: Pick<StockService, 'recordMovement'>
		uom: Pick<UomService, 'getAllConversions'>
		material: Pick<MaterialService, 'getByIds'>
	},
) {
	const { location } = deps
	const voucherService = new VoucherService({ ...infra, repo: new VoucherRepo(infra.db) })
	const shiftService = new ShiftService({ ...infra, repo: new ShiftRepo(infra.db), location })
	const tableService = new TableService({ ...infra, repo: new TableRepo(infra.db), location })
	const orderService = new OrderService({
		...infra,
		...deps,
		repo: new OrderRepo(infra.db),
		shift: shiftService,
		table: tableService,
		voucher: voucherService,
	})
	const route = new Elysia({ prefix: '/pos', tags: ['pos'] })
		.use(createVoucherRoute(voucherService))
		.use(createShiftRoute(shiftService))
		.use(createTableRoute(tableService))
		.use(createOrderRoute(orderService))
	return { route }
}
