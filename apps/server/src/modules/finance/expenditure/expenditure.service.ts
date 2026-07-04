import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import { withTransaction } from '@/infra/database'
import { stampCreate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	ExpenditureCreateDto,
	ExpenditureDto,
	ExpenditureFilterDto,
	ExpenditureUpdateDto,
} from './expenditure.contract'
import { ExpenditureError } from './expenditure.internal'
import type { IExpenditureRepo } from './expenditure.repo'

export type JournalItemInput = {
	accountId: number
	debit: string
	credit: string
}

export type JournalEntryInput = {
	date: Date
	reference: string
	sourceType: string
	sourceId: number
	note?: string
	items: JournalItemInput[]
}

export interface JournalPostPort {
	postEntry(input: JournalEntryInput, actorId: number): Promise<{ id: number }>
}

export class ExpenditureService {
	private readonly cache: CacheService

	constructor(
		private readonly journal: JournalPostPort,
		private readonly repo: IExpenditureRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'finance.expenditure')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	async handleList(filter: ExpenditureFilterDto): Promise<WithPaginationResult<ExpenditureDto>> {
		return record('ExpenditureService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<ExpenditureDto> {
		return record('ExpenditureService.handleGetById', async () => {
			const result = await this.repo.findById(id)
			if (!result) throw ExpenditureError.notFound(id)
			return result
		})
	}

	async handleCreate(data: ExpenditureCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('ExpenditureService.handleCreate', async () => {
			const result = await withTransaction(this.repo.db, async (tx) => {
				const created = await this.repo.insert(
					{
						...data,
						amount: data.amount.toString(),
						...stampCreate(actorId),
					},
					tx,
				)
				if (!created) throw ExpenditureError.createFailed()

				const items: JournalItemInput[] = [
					{
						accountId: data.targetAccountId,
						debit: data.amount.toString(),
						credit: '0',
					},
				]

				if (data.isInstallment && data.liabilityAccountId) {
					const creditAccountId =
						data.status === 'PAID' ? data.sourceAccountId : data.liabilityAccountId
					items.push({
						accountId: creditAccountId,
						debit: '0',
						credit: data.amount.toString(),
					})
				} else {
					items.push({
						accountId: data.sourceAccountId,
						debit: '0',
						credit: data.amount.toString(),
					})
				}

				await this.journal.postEntry(
					{
						date: data.date,
						reference: `EXP-${created.id.toString().padStart(6, '0')}`,
						sourceType: 'expenditure',
						sourceId: created.id,
						note: data.description ?? data.title,
						items,
					},
					actorId,
				)

				return created
			})

			await this.invalidate()
			return result
		})
	}

	async handleUpdate(data: ExpenditureUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('ExpenditureService.handleUpdate', async () => {
			const { id } = data
			const existing = await this.repo.findById(id)
			if (!existing) throw ExpenditureError.notFound(id)

			const result = await this.repo.update(id, {
				...data,
				amount: data.amount.toString(),
				updatedBy: actorId,
				updatedAt: new Date(),
			})
			if (!result) throw ExpenditureError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleDelete(id: number, _actorId: ActorId): Promise<EntityRef> {
		return record('ExpenditureService.handleDelete', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw ExpenditureError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}
}
