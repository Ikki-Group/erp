import { Elysia } from 'elysia'

import type { createShiftModule } from './shift/shift.module.ts'
import type { createVoucherModule } from './voucher/voucher.module.ts'

// ─── Aggregate Route ───

type VoucherModule = ReturnType<typeof createVoucherModule>
type ShiftModule = ReturnType<typeof createShiftModule>

export function createPosRoute(modules: { voucher: VoucherModule; shift: ShiftModule }) {
	return new Elysia({ prefix: '/pos' }).use(modules.voucher.route).use(modules.shift.route)
}
