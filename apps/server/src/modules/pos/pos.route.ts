import { Elysia } from 'elysia'

import type { createVoucherModule } from './voucher/voucher.module.ts'

// ─── Aggregate Route ───

type VoucherModule = ReturnType<typeof createVoucherModule>

export function createPosRoute(modules: { voucher: VoucherModule }) {
	return new Elysia({ prefix: '/pos' }).use(modules.voucher.route)
}
