import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import { createPosRoute } from './pos.route.ts'
import { createVoucherModule } from './voucher/voucher.module.ts'

// ─── Module Factory ───

export function createPosModule(db: DbContext, cacheClient: CacheClient) {
	const voucher = createVoucherModule(db, cacheClient)
	const route = createPosRoute({ voucher })
	return { route, voucherService: voucher.service }
}
