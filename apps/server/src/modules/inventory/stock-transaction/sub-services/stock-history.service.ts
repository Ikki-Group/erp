import type { WithPaginationResult } from '@/shared/types/pagination'

import type {
	StockTransactionDto,
	StockTransactionFilterDto,
	StockTransactionSelectDto,
} from '../stock-transaction.contract'
import { StockTransactionError } from '../stock-transaction.internal'
import type { IStockTransactionRepo } from '../stock-transaction.repo'

export class StockHistoryService {
	constructor(private readonly repo: IStockTransactionRepo) {}

	async getById(id: number): Promise<StockTransactionDto> {
		const result = await this.repo.findById(id)
		if (!result) throw StockTransactionError.notFound(id)
		return result
	}

	async handleList(
		filter: StockTransactionFilterDto,
	): Promise<WithPaginationResult<StockTransactionSelectDto>> {
		return this.repo.findPage(filter)
	}

	async handleDetail(id: number): Promise<StockTransactionDto> {
		return this.getById(id)
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		const existing = await this.repo.findById(id)
		if (!existing) throw StockTransactionError.notFound(id)
		const result = await this.repo.softDelete(id, actorId)
		if (!result) throw StockTransactionError.notFound(id)
		return result
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		const result = await this.repo.hardDelete(id)
		if (!result) throw StockTransactionError.notFound(id)
		return result
	}
}
