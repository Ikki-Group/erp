import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { SupplierRepo } from './supplier/supplier.repo'
import { initSupplierRoute } from './supplier/supplier.route'
import { SupplierService } from './supplier/supplier.service'

export class SupplierServiceModule {
	public readonly supplier: SupplierService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const supplierRepo = new SupplierRepo(this.db, this.cacheClient)
		this.supplier = new SupplierService(supplierRepo)
	}
}

export function initSupplierRouteModule(s: SupplierServiceModule) {
	return new Elysia({ prefix: '/supplier' }).use(initSupplierRoute(s.supplier))
}

// Feature exports
export * from './supplier/supplier.dto'
export * from './supplier/supplier.repo'
export * from './supplier/supplier.service'
export * from './supplier/supplier.route'
