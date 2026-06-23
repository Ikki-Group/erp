import { record } from '@elysiajs/opentelemetry'

import type { DbClient } from '@/infra/database'

import * as dto from './sales-reporting.contract'
import { SalesReportingRepo } from './sales-reporting.repo'

export class SalesReportingService {
	private readonly repo: SalesReportingRepo

	constructor(db: DbClient) {
		this.repo = new SalesReportingRepo(db)
	}

	async getRevenueOverTime(
		query: dto.SalesReportRequestDto,
	): Promise<dto.SalesRevenueChartResponseDto> {
		return record('SalesReportingService.getRevenueOverTime', async () => {
			const data = await this.repo.getRevenueOverTime(query)

			const totalRevenue = data.reduce((sum, d) => sum + Number(d.revenue), 0)
			const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0

			return {
				chartType: 'line' as const,
				data: data.map((d) => ({
					date: String(d.date),
					revenue: String(d.revenue),
					orderCount: d.orderCount,
				})),
				summary: {
					total: String(totalRevenue),
					average: String(avgRevenue),
					min: String(Math.min(...data.map((d) => Number(d.revenue)))),
					max: String(Math.max(...data.map((d) => Number(d.revenue)))),
					count: data.length,
				},
			}
		})
	}

	async getTopProducts(query: dto.SalesReportRequestDto): Promise<dto.TopProductsChartResponseDto> {
		return record('SalesReportingService.getTopProducts', async () => {
			const data = await this.repo.getTopProducts(query)

			const totalRevenue = data.reduce((sum, d) => sum + Number(d.totalRevenue), 0)
			const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0

			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					productId: d.productId,
					productName: d.itemName,
					totalQuantity: d.totalQuantity,
					totalRevenue: String(d.totalRevenue),
				})),
				summary: {
					total: String(totalRevenue),
					average: String(avgRevenue),
					min: String(Math.min(...data.map((d) => Number(d.totalRevenue)))),
					max: String(Math.max(...data.map((d) => Number(d.totalRevenue)))),
					count: data.length,
				},
			}
		})
	}

	async getSalesByLocation(
		query: dto.SalesReportRequestDto,
	): Promise<dto.SalesByLocationChartResponseDto> {
		return record('SalesReportingService.getSalesByLocation', async () => {
			const data = await this.repo.getSalesByLocation(query)

			const totalRevenue = data.reduce((sum, d) => sum + Number(d.revenue), 0)
			const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0

			return {
				chartType: 'pie' as const,
				data: data.map((d) => ({
					locationId: d.locationId,
					revenue: String(d.revenue),
					orderCount: d.orderCount,
				})),
				summary: {
					total: String(totalRevenue),
					average: String(avgRevenue),
					min: String(Math.min(...data.map((d) => Number(d.revenue)))),
					max: String(Math.max(...data.map((d) => Number(d.revenue)))),
					count: data.length,
				},
			}
		})
	}

	async getSalesByType(query: dto.SalesReportRequestDto): Promise<dto.SalesByTypeChartResponseDto> {
		return record('SalesReportingService.getSalesByType', async () => {
			const data = await this.repo.getSalesByType(query)

			const totalRevenue = data.reduce((sum, d) => sum + Number(d.revenue), 0)

			return {
				chartType: 'donut' as const,
				data: data.map((d) => ({
					salesTypeId: d.salesTypeId,
					revenue: String(d.revenue),
					orderCount: d.orderCount,
					percentage: totalRevenue > 0 ? String((Number(d.revenue) / totalRevenue) * 100) : '0',
				})),
				summary: {
					total: String(totalRevenue),
					average: totalRevenue > 0 ? String(totalRevenue / data.length) : '0',
					min: String(Math.min(...data.map((d) => Number(d.revenue)))),
					max: String(Math.max(...data.map((d) => Number(d.revenue)))),
					count: data.length,
				},
			}
		})
	}
}
