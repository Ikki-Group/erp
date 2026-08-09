import { Elysia } from 'elysia'

import type { createOrderModule } from './order/order.module.ts'
import type { createShiftModule } from './shift/shift.module.ts'
import type { createTableModule } from './table/table.module.ts'
import type { createVoucherModule } from './voucher/voucher.module.ts'

// ─── Aggregate Route ───

type VoucherModule = ReturnType<typeof createVoucherModule>
type ShiftModule = ReturnType<typeof createShiftModule>
type TableModule = ReturnType<typeof createTableModule>
type OrderModule = ReturnType<typeof createOrderModule>

export function createPosRoute(modules: {
	voucher: VoucherModule
	shift: ShiftModule
	table: TableModule
	order: OrderModule
}) {
	return new Elysia({ prefix: '/pos', tags: ['pos'] })
		.use(modules.voucher.route)
		.use(modules.shift.route)
		.use(modules.table.route)
		.use(modules.order.route)
}
