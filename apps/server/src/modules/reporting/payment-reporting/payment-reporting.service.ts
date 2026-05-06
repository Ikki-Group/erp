import { record } from '@elysiajs/opentelemetry'

import type { DbClient } from '@/core/database'

import * as dto from './payment-reporting.dto'
import { PaymentReportingRepo } from './payment-reporting.repo'

export class PaymentReportingService {
	private readonly repo: PaymentReportingRepo

	constructor(db: DbClient) {
		this.repo = new PaymentReportingRepo(db)
	}

	async getPaymentsByMethod(
		query: dto.PaymentReportRequestDto,
	): Promise<dto.PaymentByMethodResponseDto> {
		return record('PaymentReportingService.getPaymentsByMethod', async () => {
			const data = await this.repo.getPaymentsByMethod(query)

			const totalAmount = data.reduce((sum, d) => sum + Number(d.totalAmount), 0)

			return {
				chartType: 'pie' as const,
				data: data.map((d) => ({
					method: d.method,
					category: d.method === 'cash' ? 'cash' : 'cashless',
					totalAmount: String(d.totalAmount),
					count: d.count,
					percentage: totalAmount > 0 ? String((Number(d.totalAmount) / totalAmount) * 100) : '0',
				})),
				summary: {
					total: String(totalAmount),
					average: String(totalAmount / (data.length || 1)),
					min: String(Math.min(...data.map((d) => Number(d.totalAmount)))),
					max: String(Math.max(...data.map((d) => Number(d.totalAmount)))),
					count: data.length,
				},
			}
		})
	}

	async getPaymentsOverTime(
		query: dto.PaymentReportRequestDto,
	): Promise<dto.PaymentOverTimeResponseDto> {
		return record('PaymentReportingService.getPaymentsOverTime', async () => {
			const data = await this.repo.getPaymentsOverTime(query)

			const totalPayable = data.reduce((sum, d) => sum + Number(d.payableAmount), 0)
			const totalReceivable = data.reduce((sum, d) => sum + Number(d.receivableAmount), 0)

			return {
				chartType: 'line' as const,
				data: data.map((d) => ({
					date: String(d.date),
					payableAmount: String(d.payableAmount),
					receivableAmount: String(d.receivableAmount),
					totalAmount: String(Number(d.payableAmount) + Number(d.receivableAmount)),
				})),
				summary: {
					total: String(totalPayable + totalReceivable),
					average: String((totalPayable + totalReceivable) / (data.length || 1)),
					min: String(
						Math.min(...data.map((d) => Number(d.payableAmount) + Number(d.receivableAmount))),
					),
					max: String(
						Math.max(...data.map((d) => Number(d.payableAmount) + Number(d.receivableAmount))),
					),
					count: data.length,
				},
			}
		})
	}

	async getPaymentsByAccount(
		query: dto.PaymentReportRequestDto,
	): Promise<dto.PaymentByAccountResponseDto> {
		return record('PaymentReportingService.getPaymentsByAccount', async () => {
			const data = await this.repo.getPaymentsByAccount(query)

			const totalAmount = data.reduce((sum, d) => sum + Number(d.totalAmount), 0)
			const avgAmount = data.length > 0 ? totalAmount / data.length : 0

			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					accountId: d.accountId,
					accountName: d.accountName,
					accountCode: d.accountCode,
					totalAmount: String(d.totalAmount),
					count: d.count,
				})),
				summary: {
					total: String(totalAmount),
					average: String(avgAmount),
					min: String(Math.min(...data.map((d) => Number(d.totalAmount)))),
					max: String(Math.max(...data.map((d) => Number(d.totalAmount)))),
					count: data.length,
				},
			}
		})
	}
}
