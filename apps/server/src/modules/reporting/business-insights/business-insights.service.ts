import { record } from '@elysiajs/opentelemetry'

import type { DbClient } from '@/infra/database'

import * as dto from './business-insights.contract'
import { BusinessInsightsRepo } from './business-insights.repo'

export class BusinessInsightsService {
	private readonly repo: BusinessInsightsRepo

	constructor(db: DbClient) {
		this.repo = new BusinessInsightsRepo(db)
	}

	async getProfitability(
		query: dto.BusinessInsightsRequestDto,
	): Promise<dto.ProfitabilityResponseDto> {
		return record('BusinessInsightsService.getProfitability', async () => {
			const revenueRows = await this.repo.getRevenueRows(query)
			const cogsRows = await this.repo.getCogsRows(query)

			const cogsMap = new Map(cogsRows.map((r) => [r.date.toISOString().slice(0, 10), r.cogs]))
			const data = revenueRows.map((r) => {
				const dateKey = r.date.toISOString().slice(0, 10)
				const cogs = cogsMap.get(dateKey) ?? 0
				const profit = r.revenue - cogs
				return {
					date: r.date,
					revenue: String(r.revenue),
					cogs: String(cogs),
					expenses: '0',
					profit: String(profit),
					margin: r.revenue > 0 ? Math.round((profit / r.revenue) * 1000) / 10 : 0,
				}
			})

			const totalRevenue = data.reduce((s, d) => s + Number(d.revenue), 0)
			return {
				chartType: 'bar' as const,
				data,
				summary: {
					total: String(totalRevenue),
					average: String(data.length > 0 ? totalRevenue / data.length : 0),
					min: String(Math.min(...data.map((d) => Number(d.profit)), 0)),
					max: String(Math.max(...data.map((d) => Number(d.profit)), 0)),
					count: data.length,
				},
			}
		})
	}

	async getLocationPerformance(
		query: dto.BusinessInsightsRequestDto,
	): Promise<dto.LocationPerformanceResponseDto> {
		return record('BusinessInsightsService.getLocationPerformance', async () => {
			const data = await this.repo.getLocationPerformance(query)

			const result = data.map((d) => {
				const profit = Number(d.totalRevenue) - Number(d.totalCost)
				return {
					...d,
					totalRevenue: String(d.totalRevenue),
					totalCost: String(d.totalCost),
					profit: String(profit),
					avgOrderValue: String(d.totalSales > 0 ? Number(d.totalRevenue) / d.totalSales : 0),
				}
			})

			const totalRevenue = result.reduce((s, d) => s + Number(d.totalRevenue), 0)
			return {
				chartType: 'bar' as const,
				data: result,
				summary: {
					total: String(totalRevenue),
					average: String(result.length > 0 ? totalRevenue / result.length : 0),
					min: String(Math.min(...result.map((d) => Number(d.totalRevenue)), 0)),
					max: String(Math.max(...result.map((d) => Number(d.totalRevenue)), 0)),
					count: result.length,
				},
			}
		})
	}

	async getInventoryTurnover(
		query: dto.BusinessInsightsRequestDto,
	): Promise<dto.InventoryTurnoverResponseDto> {
		return record('BusinessInsightsService.getInventoryTurnover', async () => {
			const cogsRows = await this.repo.getCogsRowsForInventoryTurnover(query)
			const avgInvRows = await this.repo.getAvgInventoryRows(query)

			const avgInvMap = new Map(avgInvRows.map((r) => [r.materialId, r.avgStock]))

			const data = await Promise.all(
				cogsRows.map(async (row) => {
					const material = await this.repo.getMaterialName(row.materialId)
					const avgInv = avgInvMap.get(row.materialId) ?? 0
					const turnover = avgInv > 0 ? Math.round((row.cogs / avgInv) * 100) / 100 : 0
					const days = turnover > 0 ? Math.round(365 / turnover) : 0
					return {
						materialId: row.materialId,
						materialName: material[0]?.name ?? 'Unknown',
						cogs: String(row.cogs),
						avgInventory: String(avgInv),
						turnoverRatio: turnover,
						daysInInventory: days,
					}
				}),
			)

			return {
				chartType: 'bar' as const,
				data,
				summary: {
					total: String(data.reduce((s, d) => s + d.turnoverRatio, 0)),
					average: String(
						data.length > 0 ? data.reduce((s, d) => s + d.turnoverRatio, 0) / data.length : 0,
					),
					min: String(Math.min(...data.map((d) => d.turnoverRatio), 0)),
					max: String(Math.max(...data.map((d) => d.turnoverRatio), 0)),
					count: data.length,
				},
			}
		})
	}
}
