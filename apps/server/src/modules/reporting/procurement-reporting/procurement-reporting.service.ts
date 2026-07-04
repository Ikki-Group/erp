import { record } from '@elysiajs/opentelemetry'

import * as dto from './procurement-reporting.contract'
import type { IProcurementReportingRepo } from './procurement-reporting.repo'

export class ProcurementReportingService {
	constructor(private readonly repo: IProcurementReportingRepo) {}

	async handleGetPurchasesReport(
		query: dto.ProcurementReportRequestDto,
	): Promise<dto.PurchaseReportResponseDto> {
		return record('ProcurementReportingService.handleGetPurchasesReport', async () => {
			const data = await this.repo.getPurchasesReport(query)

			const totalAmount = data.reduce((s, d) => s + Number(d.totalAmount), 0)
			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					qty: Number(d.qty),
					unitPrice: String(d.unitPrice),
					totalAmount: String(d.totalAmount),
				})),
				summary: {
					total: String(totalAmount),
					average: String(data.length > 0 ? totalAmount / data.length : 0),
					min: String(Math.min(...data.map((d) => Number(d.totalAmount)), 0)),
					max: String(Math.max(...data.map((d) => Number(d.totalAmount)), 0)),
					count: data.length,
				},
			}
		})
	}

	async handleGetSuppliersReport(
		query: dto.ProcurementReportRequestDto,
	): Promise<dto.SupplierReportResponseDto> {
		return record('ProcurementReportingService.handleGetSuppliersReport', async () => {
			const data = await this.repo.getSuppliersReport(query)

			const totalAmount = data.reduce((s, d) => s + Number(d.totalAmount), 0)
			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					totalAmount: String(d.totalAmount),
					averageDeliveryDays: 0,
				})),
				summary: {
					total: String(totalAmount),
					average: String(data.length > 0 ? totalAmount / data.length : 0),
					min: String(Math.min(...data.map((d) => Number(d.totalAmount)), 0)),
					max: String(Math.max(...data.map((d) => Number(d.totalAmount)), 0)),
					count: data.length,
				},
			}
		})
	}

	async handleGetTransfersReport(
		query: dto.ProcurementReportRequestDto,
	): Promise<dto.TransferReportResponseDto> {
		return record('ProcurementReportingService.handleGetTransfersReport', async () => {
			const data = await this.repo.getTransfersReport(query)

			const totalCost = data.reduce((s, d) => s + Number(d.totalCost), 0)
			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					qty: Number(d.qty),
					unitCost: String(d.unitCost),
					totalCost: String(d.totalCost),
				})),
				summary: {
					total: String(totalCost),
					average: String(data.length > 0 ? totalCost / data.length : 0),
					min: String(Math.min(...data.map((d) => Number(d.totalCost)), 0)),
					max: String(Math.max(...data.map((d) => Number(d.totalCost)), 0)),
					count: data.length,
				},
			}
		})
	}

	async handleGetCostsReport(
		query: dto.ProcurementReportRequestDto,
	): Promise<dto.CostReportResponseDto> {
		return record('ProcurementReportingService.handleGetCostsReport', async () => {
			const data = await this.repo.getCostsReport(query)

			const totalCost = data.reduce((s, d) => s + Number(d.unitPrice) * Number(d.qty), 0)
			return {
				chartType: 'line' as const,
				data: data.map((d) => ({
					...d,
					unitPrice: String(d.unitPrice),
					qty: Number(d.qty),
				})),
				summary: {
					total: String(totalCost),
					average: String(data.length > 0 ? totalCost / data.length : 0),
					min: String(Math.min(...data.map((d) => Number(d.unitPrice) * Number(d.qty)), 0)),
					max: String(Math.max(...data.map((d) => Number(d.unitPrice) * Number(d.qty)), 0)),
					count: data.length,
				},
			}
		})
	}
}
