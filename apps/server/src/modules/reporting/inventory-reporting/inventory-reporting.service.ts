import { record } from '@elysiajs/opentelemetry'

import * as dto from './inventory-reporting.contract'
import type { IInventoryReportingRepo } from './inventory-reporting.repo'

export class InventoryReportingService {
	constructor(private readonly repo: IInventoryReportingRepo) {}

	async handleGetStockLevels(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.StockLevelResponseDto> {
		return record('InventoryReportingService.handleGetStockLevels', async () => {
			const { data, summary } = await this.repo.getStockLevels(query)
			const s = summary

			return {
				data: data.map((d) => ({ ...d, sku: d.sku ?? '' })),
				summary: {
					total: String(s?.total ?? 0),
					average: String((s?.total ?? 0) / (s?.count ?? 1)),
					min: '0',
					max: '0',
					count: s?.count ?? 0,
				},
			}
		})
	}

	async handleGetStockValue(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.StockValueResponseDto> {
		return record('InventoryReportingService.handleGetStockValue', async () => {
			const { rows, summary } = await this.repo.getStockValue(query)
			const s = summary

			const data = rows.map((r) => ({
				...r,
				sku: r.sku ?? '',
				unitCost: String(r.unitCost),
				totalValue: String(r.totalValue),
			}))

			return {
				chartType: 'bar' as const,
				data,
				summary: {
					total: String(s?.total ?? 0),
					average: String((s?.total ?? 0) / (s?.count ?? 1)),
					min: '0',
					max: '0',
					count: s?.count ?? 0,
				},
			}
		})
	}

	async handleGetLowStockItems(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.LowStockResponseDto> {
		return record('InventoryReportingService.handleGetLowStockItems', async () => {
			const { data, summary } = await this.repo.getLowStockItems(query)
			const s = summary

			return {
				data: data.map((d) => ({ ...d, sku: d.sku ?? '' })),
				summary: {
					total: String(s?.count ?? 0),
					average: '0',
					min: '0',
					max: '0',
					count: s?.count ?? 0,
				},
			}
		})
	}

	async handleGetInventoryMovements(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.InventoryMovementChartResponseDto> {
		return record('InventoryReportingService.handleGetInventoryMovements', async () => {
			const movements = await this.repo.getInventoryMovements(query)

			const data = movements.map((m) => ({
				date: m.date,
				quantityIn: Math.round((m.quantityIn + Math.max(m.netAdjustment, 0)) * 100) / 100,
				quantityOut:
					Math.round((m.quantityOut + Math.abs(Math.min(m.netAdjustment, 0))) * 100) / 100,
				netMovement: Math.round((m.quantityIn - m.quantityOut + m.netAdjustment) * 100) / 100,
			}))

			const totalIn = data.reduce((sum, d) => sum + d.quantityIn, 0)
			const totalOut = data.reduce((sum, d) => sum + d.quantityOut, 0)
			const count = data.length

			return {
				chartType: 'area' as const,
				data,
				summary: {
					total: String(totalIn + totalOut),
					average: String(count > 0 ? totalIn / count : 0),
					min: '0',
					max: '0',
					count,
				},
			}
		})
	}

	async handleGetOpnameReport(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.OpnameVarianceResponseDto> {
		return record('InventoryReportingService.handleGetOpnameReport', async () => {
			const data = await this.repo.getOpnameReport(query)
			const totalVariance = data.reduce((s, d) => s + d.variance, 0)

			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					expectedQty: Math.abs(d.expectedQty),
					actualQty: Math.abs(d.actualQty),
					variance: d.variance,
					varianceCost: String(d.varianceCost),
				})),
				summary: {
					total: String(totalVariance),
					average: String(data.length > 0 ? totalVariance / data.length : 0),
					min: String(Math.min(...data.map((d) => d.variance), 0)),
					max: String(Math.max(...data.map((d) => d.variance), 0)),
					count: data.length,
				},
			}
		})
	}

	async handleGetConsumptionReport(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.ConsumptionResponseDto> {
		return record('InventoryReportingService.handleGetConsumptionReport', async () => {
			const data = await this.repo.getConsumptionReport(query)
			const totalQty = data.reduce((s, d) => s + d.quantity, 0)

			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					quantity: d.quantity,
					cost: String(d.cost),
					unit: d.unit ?? '',
				})),
				summary: {
					total: String(totalQty),
					average: String(data.length > 0 ? totalQty / data.length : 0),
					min: String(Math.min(...data.map((d) => d.quantity), 0)),
					max: String(Math.max(...data.map((d) => d.quantity), 0)),
					count: data.length,
				},
			}
		})
	}

	async handleGetWasteReport(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.WasteResponseDto> {
		return record('InventoryReportingService.handleGetWasteReport', async () => {
			const data = await this.repo.getWasteReport(query)
			const totalQty = data.reduce((s, d) => s + d.quantity, 0)

			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					quantity: d.quantity,
					cost: String(d.cost),
					unit: d.unit ?? '',
					reason: d.reason ?? undefined,
				})),
				summary: {
					total: String(totalQty),
					average: String(data.length > 0 ? totalQty / data.length : 0),
					min: String(Math.min(...data.map((d) => d.quantity), 0)),
					max: String(Math.max(...data.map((d) => d.quantity), 0)),
					count: data.length,
				},
			}
		})
	}
}
