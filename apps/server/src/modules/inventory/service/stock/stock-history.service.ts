import { record } from '@elysiajs/opentelemetry'

import { NotFoundError } from '@/core/http/errors'

import type { WithPaginationResult } from '@/core/utils/pagination'

import type {
	StockTransactionFilterDto,
	StockTransactionSelectDto,
	StockTransactionDto,
} from '@/modules/inventory/dto'
import { StockTransactionRepo } from '@/modules/inventory/repo'

export class StockHistoryService {
	constructor(private readonly repo = new StockTransactionRepo()) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	/**
	 * Get a single transaction by ID.
	 */
	async getById(id: number): Promise<StockTransactionDto> {
		return record('StockHistoryService.getById', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw new NotFoundError(`Stock transaction ${id} not found`)
			return result as unknown as StockTransactionDto
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	/**
	 * List transactions with filters (paginated), enriched with material info.
	 */
	async handleList(
		filter: StockTransactionFilterDto,
	): Promise<WithPaginationResult<StockTransactionSelectDto>> {
		return record('StockHistoryService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return {
				...result,
				data: result.data as unknown as StockTransactionSelectDto[],
			}
		})
	}

	/**
	 * Get a single transaction by ID.
	 */
	async handleDetail(id: number): Promise<StockTransactionDto> {
		return record('StockHistoryService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	/**
	 * Marks a transaction as deleted (Soft Delete).
	 */
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('StockHistoryService.handleRemove', async () => {
			const existing = await this.repo.getById(id)
			if (!existing) throw new NotFoundError(`Stock transaction ${id} not found`)
			return this.repo.softDelete(id, actorId)
		})
	}

	/**
	 * Permanently deletes a transaction (Hard Delete).
	 */
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('StockHistoryService.handleHardRemove', async () => {
			return this.repo.hardDelete(id)
		})
	}
}
