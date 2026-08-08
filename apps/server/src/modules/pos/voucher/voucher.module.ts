import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import { VoucherRepo } from './voucher.repo.ts'
import { createVoucherRoute } from './voucher.route.ts'
import { VoucherService } from './voucher.service.ts'

// ─── Module Factory ───

export function createVoucherModule(db: DbContext, cacheClient: CacheClient) {
	const repo = new VoucherRepo(db)
	const service = new VoucherService(repo, cacheClient)
	const route = createVoucherRoute(service)
	return { route, service }
}
