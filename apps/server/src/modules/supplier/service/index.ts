import { SupplierService } from './supplier.service'

export class SupplierServiceModule {
	public supplier: SupplierService

	constructor() {
		this.supplier = new SupplierService()
	}
}

export * from './supplier.service'
