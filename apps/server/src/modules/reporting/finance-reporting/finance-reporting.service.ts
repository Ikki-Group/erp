import { record } from '@elysiajs/opentelemetry'

import type { DbClient } from '@/infra/database'

import * as dto from './finance-reporting.dto'
import { FinanceReportingRepo } from './finance-reporting.repo'

export class FinanceReportingService {
	private readonly repo: FinanceReportingRepo

	constructor(db: DbClient) {
		this.repo = new FinanceReportingRepo(db)
	}

	async getCashFlow(_query: dto.FinanceReportRequestDto): Promise<dto.CashFlowChartResponseDto> {
		return record('FinanceReportingService.getCashFlow', () => {
			throw new Error(
				'Cash flow reporting not yet implemented - generalLedgerTable needs to be created',
			)
		})
	}

	async getAccountBalances(
		_query: dto.FinanceReportRequestDto,
	): Promise<dto.AccountBalanceResponseDto> {
		return record('FinanceReportingService.getAccountBalances', () => {
			throw new Error(
				'Account balance reporting not yet implemented - requires journal entry aggregation',
			)
		})
	}

	async getExpenditureByCategory(
		query: dto.FinanceReportRequestDto,
	): Promise<dto.ExpenditureByCategoryResponseDto> {
		return record('FinanceReportingService.getExpenditureByCategory', async () => {
			const data = await this.repo.getExpenditureByCategory(query)

			const totalAmount = data.reduce((sum, d) => sum + Number(d.totalAmount), 0)

			return {
				chartType: 'pie' as const,
				data: data.map((d) => ({
					categoryId: d.categoryId,
					categoryName: d.categoryName,
					totalAmount: String(d.totalAmount),
					percentage: totalAmount > 0 ? String((Number(d.totalAmount) / totalAmount) * 100) : '0',
				})),
				summary: {
					total: String(totalAmount),
					average: totalAmount > 0 ? String(totalAmount / data.length) : '0',
					min: String(Math.min(...data.map((d) => Number(d.totalAmount)))),
					max: String(Math.max(...data.map((d) => Number(d.totalAmount)))),
					count: data.length,
				},
			}
		})
	}
}
