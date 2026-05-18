import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'

import type { DbClient } from '@/infra/database'

import { SupplierRepo } from './supplier.repo'
import { initSupplierRoute } from './supplier.route'
import type {
	SupplierSchema,
	SupplierFilterSchema,
	SupplierCreateSchema,
	SupplierUpdateSchema,
} from './supplier.schema'
import { SupplierService } from './supplier.service'

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

export type { SupplierSchema, SupplierFilterSchema, SupplierCreateSchema, SupplierUpdateSchema }
export type { SupplierService } from './supplier.service'
