import Elysia from 'elysia'
import type { SupplierServiceModule } from '../service'
import { initSupplierRoute } from './supplier.route'

export function initSupplierRouteModule(service: SupplierServiceModule) {
	const supplierRouter = initSupplierRoute(service)
	return new Elysia().use(supplierRouter)
}

export * from './supplier.route'
