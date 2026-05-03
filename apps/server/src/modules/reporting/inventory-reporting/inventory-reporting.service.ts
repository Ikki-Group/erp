/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { record } from '@elysiajs/opentelemetry'

import * as dto from './inventory-reporting.dto'

export class InventoryReportingService {
	async getStockLevels(_query: dto.InventoryReportRequestDto): Promise<dto.StockLevelResponseDto> {
		// eslint-disable-next-line @typescript-eslint/require-await
		return record('InventoryReportingService.getStockLevels', async () => {
			// TODO: Inventory reporting needs proper product stock table structure
			throw new Error(
				'Inventory reporting not yet implemented - requires product stock table structure',
			)
		})
	}

	async getStockValue(_query: dto.InventoryReportRequestDto): Promise<dto.StockValueResponseDto> {
		// eslint-disable-next-line @typescript-eslint/require-await
		return record('InventoryReportingService.getStockValue', async () => {
			// TODO: Inventory reporting needs proper product stock table structure
			throw new Error(
				'Inventory reporting not yet implemented - requires product stock table structure',
			)
		})
	}

	async getLowStockItems(_query: dto.InventoryReportRequestDto): Promise<dto.LowStockResponseDto> {
		// eslint-disable-next-line @typescript-eslint/require-await
		return record('InventoryReportingService.getLowStockItems', async () => {
			// TODO: Inventory reporting needs proper product stock table structure
			throw new Error(
				'Inventory reporting not yet implemented - requires product stock table structure',
			)
		})
	}

	async getInventoryMovements(
		_query: dto.InventoryReportRequestDto,
	): Promise<dto.InventoryMovementChartResponseDto> {
		// eslint-disable-next-line @typescript-eslint/require-await
		return record('InventoryReportingService.getInventoryMovements', async () => {
			// TODO: Inventory reporting needs proper product stock table structure
			throw new Error(
				'Inventory reporting not yet implemented - requires product stock table structure',
			)
		})
	}
}
