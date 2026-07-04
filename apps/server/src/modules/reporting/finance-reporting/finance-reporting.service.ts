import { record } from '@elysiajs/opentelemetry'

import * as dto from './finance-reporting.contract'
import type { IFinanceReportingRepo } from './finance-reporting.repo'

export class FinanceReportingService {
	constructor(private readonly repo: IFinanceReportingRepo) {}

	async handleGetCashFlow(_query: dto.FinanceReportRequestDto): Promise<dto.CashFlowChartResponseDto> {
		return record('FinanceReportingService.handleGetCashFlow', () => {
			throw new Error(
				'Cash flow reporting not yet implemented - generalLedgerTable needs to be created',
			)
		})
	}

	async handleGetAccountBalances(
		_query: dto.FinanceReportRequestDto,
	): Promise<dto.AccountBalanceResponseDto> {
		return record('FinanceReportingService.handleGetAccountBalances', () => {
			throw new Error(
				'Account balance reporting not yet implemented - requires journal entry aggregation',
			)
		})
	}

	async handleGetExpenditureByCategory(
		query: dto.FinanceReportRequestDto,
	): Promise<dto.ExpenditureByCategoryResponseDto> {
		return record('FinanceReportingService.handleGetExpenditureByCategory', async () => {
			const data = await this.repo.getExpenditureByCategory(query)

			const totalAmount = data.reduce((sum, d) => sum + Number(d.totalAmount), 0)

			return {
				chartType: 'pie' as const,
				data: data.map((d) => ({
					categoryId: d.categoryId,
					categoryName: d.categoryName,
					totalAmount: String(d.totalAmount),
					percentage:
						totalAmount > 0 ? String((Number(d.totalAmount) / totalAmount) * 100) : '0',
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
