import { record } from '@elysiajs/opentelemetry'

import type { DbClient } from '@/core/database'

import * as dto from './crm-reporting.dto'
import { CrmReportingRepo } from './crm-reporting.repo'

export class CrmReportingService {
	private readonly repo: CrmReportingRepo

	constructor(db: DbClient) {
		this.repo = new CrmReportingRepo(db)
	}

	async getCustomerGrowth(
		query: dto.CrmReportRequestDto,
	): Promise<dto.CustomerGrowthChartResponseDto> {
		return record('CrmReportingService.getCustomerGrowth', async () => {
			const data = await this.repo.getCustomerGrowth(query)
			const totalNewCustomers = data.reduce((sum, d) => sum + d.newCustomers, 0)
			const runningTotal: number[] = []
			let cumulative = 0

			const dataWithTotal = data.map((d) => {
				cumulative += d.newCustomers
				runningTotal.push(cumulative)
				return {
					date: String(d.date),
					newCustomers: d.newCustomers,
					totalCustomers: cumulative,
				}
			})

			return {
				chartType: 'line' as const,
				data: dataWithTotal,
				summary: {
					total: String(totalNewCustomers),
					average: String(totalNewCustomers / (data.length || 1)),
					min: String(Math.min(...data.map((d) => d.newCustomers))),
					max: String(Math.max(...data.map((d) => d.newCustomers))),
					count: data.length,
				},
			}
		})
	}

	async getCustomersByTier(query: dto.CrmReportRequestDto): Promise<dto.CustomerByTierResponseDto> {
		return record('CrmReportingService.getCustomersByTier', async () => {
			const data = await this.repo.getCustomersByTier(query)
			const totalCustomers = data.reduce((sum, d) => sum + d.customerCount, 0)

			return {
				chartType: 'pie' as const,
				data: data.map((d) => ({
					tierId: d.tier,
					tierName: d.tierName,
					customerCount: d.customerCount,
					percentage: totalCustomers > 0 ? String((d.customerCount / totalCustomers) * 100) : '0',
				})),
				summary: {
					total: String(totalCustomers),
					average: String(totalCustomers / (data.length || 1)),
					min: String(Math.min(...data.map((d) => d.customerCount))),
					max: String(Math.max(...data.map((d) => d.customerCount))),
					count: data.length,
				},
			}
		})
	}

	async getTopCustomers(query: dto.CrmReportRequestDto): Promise<dto.TopCustomersResponseDto> {
		return record('CrmReportingService.getTopCustomers', async () => {
			const data = await this.repo.getTopCustomers(query)
			const totalSpent = data.reduce((sum, d) => sum + Number(d.totalSpent), 0)
			const avgSpent = data.length > 0 ? totalSpent / data.length : 0

			return {
				chartType: 'bar' as const,
				data: data
					.filter((d) => d.customerId !== null)
					.map((d) => ({
						customerId: d.customerId as number,
						customerName: d.customerName,
						email: d.email,
						totalSpent: String(d.totalSpent),
						orderCount: d.orderCount,
					})),
				summary: {
					total: String(totalSpent),
					average: String(avgSpent),
					min: String(Math.min(...data.map((d) => Number(d.totalSpent)))),
					max: String(Math.max(...data.map((d) => Number(d.totalSpent)))),
					count: data.length,
				},
			}
		})
	}

	async getLoyaltyPointsSummary(
		query: dto.CrmReportRequestDto,
	): Promise<dto.LoyaltyPointsResponseDto> {
		return record('CrmReportingService.getLoyaltyPointsSummary', async () => {
			const data = await this.repo.getLoyaltyPointsSummary(query)
			const pointsIssued = data[0]?.pointsIssued ?? 0
			const pointsRedeemed = data[0]?.pointsRedeemed ?? 0
			const pointsBalance = pointsIssued - pointsRedeemed

			return {
				data: {
					totalPointsIssued: String(pointsIssued),
					totalPointsRedeemed: String(pointsRedeemed),
					pointsBalance: String(pointsBalance),
				},
			}
		})
	}
}
