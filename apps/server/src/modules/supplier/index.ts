import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type {
	SupplierDto,
	SupplierFilterDto,
	SupplierCreateDto,
	SupplierUpdateDto,
} from './supplier.contract'
import { SupplierRepo } from './supplier.repo'
import { initSupplierRoute } from './supplier.route'
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

export type { SupplierDto, SupplierFilterDto, SupplierCreateDto, SupplierUpdateDto }
export type { SupplierService } from './supplier.service'
