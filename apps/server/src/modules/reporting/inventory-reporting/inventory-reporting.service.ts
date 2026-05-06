import { record } from '@elysiajs/opentelemetry'

import type { DbClient } from '@/core/database'

import * as dto from './inventory-reporting.dto'
import { InventoryReportingRepo } from './inventory-reporting.repo'

export class InventoryReportingService {
	private readonly repo: InventoryReportingRepo

	constructor(db: DbClient) {
		this.repo = new InventoryReportingRepo(db)
	}

	async getStockLevels(query: dto.InventoryReportRequestDto): Promise<dto.StockLevelResponseDto> {
		return record('InventoryReportingService.getStockLevels', async () => {
			const { data, summary } = await this.repo.getStockLevels(query)
			const s = summary

			return {
				data,
				summary: {
					total: String(s?.total ?? 0),
					average: String((s?.total ?? 0) / (s?.count || 1)),
					min: '0',
					max: '0',
					count: s?.count ?? 0,
				},
			}
		})
	}

	async getStockValue(query: dto.InventoryReportRequestDto): Promise<dto.StockValueResponseDto> {
		return record('InventoryReportingService.getStockValue', async () => {
			const { rows, summary } = await this.repo.getStockValue(query)
			const s = summary

			const data = rows.map((r) => ({
				...r,
				unitCost: String(r.unitCost),
				totalValue: String(r.totalValue),
			}))

			return {
				chartType: 'bar' as const,
				data,
				summary: {
					total: String(s?.total ?? 0),
					average: String((s?.total ?? 0) / (s?.count || 1)),
					min: '0',
					max: '0',
					count: s?.count ?? 0,
				},
			}
		})
	}

	async getLowStockItems(query: dto.InventoryReportRequestDto): Promise<dto.LowStockResponseDto> {
		return record('InventoryReportingService.getLowStockItems', async () => {
			const { data, summary } = await this.repo.getLowStockItems(query)
			const s = summary

			return {
				data,
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

	async getInventoryMovements(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.InventoryMovementChartResponseDto> {
		return record('InventoryReportingService.getInventoryMovements', async () => {
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

	async getOpnameReport(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.OpnameVarianceResponseDto> {
		return record('InventoryReportingService.getOpnameReport', async () => {
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

	async getConsumptionReport(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.ConsumptionResponseDto> {
		return record('InventoryReportingService.getConsumptionReport', async () => {
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

	async getWasteReport(query: dto.InventoryReportRequestDto): Promise<dto.WasteResponseDto> {
		return record('InventoryReportingService.getWasteReport', async () => {
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
