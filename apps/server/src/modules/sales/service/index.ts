import { SalesOrderService } from './sales-order.service'

export class SalesServiceModule {
	public readonly order: SalesOrderService

	constructor() {
		this.order = new SalesOrderService()
	}
}
