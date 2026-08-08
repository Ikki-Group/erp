import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { MaterialService } from '@/modules/material/material.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import { SupplierRepo } from './supplier.repo.ts'
import { createSupplierRoute } from './supplier.route.ts'
import { SupplierService } from './supplier.service.ts'

// ─── Dependencies ───

export interface SupplierModuleDeps {
	materialService: MaterialService
	uomService: UomService
}

// ─── Module Factory ───

export function createSupplierModule(db: DbContext, cacheClient: CacheClient, deps: SupplierModuleDeps) {
	const repo = new SupplierRepo(db)
	const service = new SupplierService(repo, cacheClient, deps.materialService, deps.uomService)
	const route = createSupplierRoute(service)
	return { route, service }
}
