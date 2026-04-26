import { record } from '@elysiajs/opentelemetry'
import type { DashboardKpiFilterDto } from '../dto'
import { StockDashboardRepo } from '../repo/stock-dashboard.repo'

export class StockDashboardService {
	constructor(private readonly repo = new StockDashboardRepo()) {}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleKpi(filter: DashboardKpiFilterDto) {
		return record('StockDashboardService.handleKpi', async () => {
			return this.repo.getKpi(filter)
		})
	}
}
