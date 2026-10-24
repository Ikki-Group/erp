import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import { VoucherRepo } from './voucher.repo.ts'
import { createVoucherRoute } from './voucher.route.ts'
import { VoucherService } from './voucher.service.ts'

export interface VoucherModuleDeps {
	uow: UnitOfWork
	audit: AuditPort
}

// ─── Module Factory ───

export function createVoucherModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: VoucherModuleDeps,
) {
	const repo = new VoucherRepo(db)
	const service = new VoucherService(repo, cacheClient, deps.uow, deps.audit)
	const route = createVoucherRoute(service)
	return { route, service }
}
