import { Elysia } from 'elysia'

import { initSupplierRoute } from './supplier/supplier.route'
import { SupplierService } from './supplier/supplier.service'

export class SupplierServiceModule {
	public readonly supplier: SupplierService

	constructor() {
		this.supplier = new SupplierService()
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
