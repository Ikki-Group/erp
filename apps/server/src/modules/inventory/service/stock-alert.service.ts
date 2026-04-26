import { record } from '@elysiajs/opentelemetry'

import type { StockAlertFilterDto } from '../dto'
import { StockAlertRepo } from '../repo/stock-alert.repo'

export class StockAlertService {
	constructor(private readonly repo = new StockAlertRepo()) {}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleAlerts(filter: StockAlertFilterDto & { page?: number; limit?: number }) {
		return record('StockAlertService.handleAlerts', async () => {
			return this.repo.getAlerts(filter)
		})
	}

	async handleCount(filter: StockAlertFilterDto) {
		return record('StockAlertService.handleCount', async () => {
			return this.repo.getAlertCount(filter)
		})
	}
}
