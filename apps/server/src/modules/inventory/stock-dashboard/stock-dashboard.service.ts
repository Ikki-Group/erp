import { record } from '@elysiajs/opentelemetry'

import type { DashboardKpiFilterDto } from './stock-dashboard.dto'
import { StockDashboardRepo } from './stock-dashboard.repo'

export class StockDashboardService {
	private readonly repo = new StockDashboardRepo()

	/* --------------------------------- HANDLER -------------------------------- */

	async handleKpi(filter: DashboardKpiFilterDto) {
		return record('StockDashboardService.handleKpi', async () => {
			return this.repo.getKpi(filter)
		})
	}
}
