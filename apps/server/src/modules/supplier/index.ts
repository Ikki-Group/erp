import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { SupplierRepo } from './core/supplier.repo'
import { initSupplierRoute } from './core/supplier.route'
import { SupplierService } from './core/supplier.service'

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

export * from './core/supplier.dto'
export type { SupplierService } from './core/supplier.service'
