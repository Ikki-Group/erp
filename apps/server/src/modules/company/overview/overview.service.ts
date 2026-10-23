import type { Actor } from '@/shared/auth/actor.ts'

import type { CompanyOverviewDto } from './overview.contract.ts'
import type { IOverviewRepo } from './overview.repo.ts'

export class OverviewService {
	constructor(private readonly repo: IOverviewRepo) {}

	async handleGet(actor: Actor): Promise<CompanyOverviewDto> {
		const sites = await this.repo.findSites(actor.allowedLocations())
		const [businessDate, people, metrics] = await Promise.all([
			this.repo.businessDate(),
			actor.can(null, 'iam.read') ? this.repo.findPeople() : null,
			this.repo.findSiteMetrics(sites.map((s) => s.id)),
		])

		return {
			locations: {
				total: sites.length,
				stores: sites.filter((s) => s.type === 'store').length,
				warehouses: sites.filter((s) => s.type === 'warehouse').length,
				inactive: sites.filter((s) => !s.isActive).length,
			},
			people,
			businessDate,
			sites: sites.map((s) => ({
				...s,
				staff: metrics.staff.get(s.id) ?? 0,
				transfersInTransit: metrics.transfersInTransit.get(s.id) ?? 0,
				draftReceivings: metrics.draftReceivings.get(s.id) ?? 0,
				openOpnames: metrics.openOpnames.get(s.id) ?? 0,
				lowStock: metrics.lowStock.get(s.id) ?? 0,
				openShifts: metrics.openShifts.get(s.id) ?? 0,
				salesToday: metrics.sales.get(s.id) ?? { orders: 0, revenue: '0.00' },
			})),
		}
	}
}
