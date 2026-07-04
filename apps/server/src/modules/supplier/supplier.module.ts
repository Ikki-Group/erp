import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { SupplierRepo } from './supplier.repo'
import { SupplierService } from './supplier.service'

export type SupplierModule = SupplierService

export function createSupplierModule(db: DbContext, cacheClient: CacheClient): SupplierModule {
	const repo = new SupplierRepo(db)
	const supplier = new SupplierService(repo, cacheClient)

	return supplier
}
