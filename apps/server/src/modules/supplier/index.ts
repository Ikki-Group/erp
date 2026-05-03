import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { CacheClient } from '@/lib/cache'

import { SupplierRepo } from './core/supplier.repo'
import { initSupplierRoute } from './core/supplier.route'
import { SupplierService } from './core/supplier.service'

export class SupplierServiceModule {
	public readonly supplier: SupplierService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const supplierRepo = new SupplierRepo(this.db)
		this.supplier = new SupplierService(supplierRepo, this.cacheClient)
	}
}

export function initSupplierRouteModule(s: SupplierServiceModule) {
	return new Elysia({ prefix: '/supplier' }).use(initSupplierRoute(s.supplier))
}

export * from './core/supplier.dto'
export type { SupplierService } from './core/supplier.service'
