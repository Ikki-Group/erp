import { record } from '@elysiajs/opentelemetry'
import Decimal from 'decimal.js'

import { CacheService, type CacheClient } from '@/infra/cache'
import { withTransaction, type DbContext } from '@/infra/database'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	JournalEntryCreateDto,
	JournalEntryDto,
	JournalEntryWithItemsDto,
} from './general-ledger.contract'
import { GeneralLedgerError } from './general-ledger.internal'
import type { IGeneralLedgerRepo } from './general-ledger.repo'

export class GeneralLedgerService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IGeneralLedgerRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'finance.gl')
	}

	private async invalidate(sourceType?: string, sourceId?: number): Promise<void> {
		const keys = [this.cache.keys.list]
		if (sourceType !== undefined && sourceId !== undefined) {
			keys.push(this.cache.keys.byId(`${sourceType}.${sourceId}`))
		}
		await this.cache.deleteFromKeys(keys)
	}

	async getBySource(sourceType: string, sourceId: number): Promise<JournalEntryWithItemsDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: `source.${sourceType}.${sourceId}`,
			factory: () => this.repo.findBySource(sourceType, sourceId),
		})
	}

	async create(
		input: JournalEntryCreateDto,
		actorId: ActorId,
		db?: DbContext,
	): Promise<EntityRef> {
		const totalDebit = input.items.reduce(
			(sum, item) => sum.plus(item.debit),
			new Decimal(0),
		)
		const totalCredit = input.items.reduce(
			(sum, item) => sum.plus(item.credit),
			new Decimal(0),
		)

		if (!totalDebit.eq(totalCredit)) {
			throw GeneralLedgerError.notBalanced(totalDebit.toString(), totalCredit.toString())
		}

		const now = new Date()
		const entryData = {
			date: input.date,
			reference: input.reference,
			sourceType: input.sourceType,
			sourceId: input.sourceId,
			note: input.note ?? null,
			createdBy: actorId,
			updatedBy: actorId,
			createdAt: now,
			updatedAt: now,
		}

		const itemsData = input.items.map((item) => ({
			journalEntryId: 0 as number,
			accountId: item.accountId,
			debit: item.debit,
			credit: item.credit,
			createdBy: actorId,
			updatedBy: actorId,
			createdAt: now,
			updatedAt: now,
		}))

		const result = await withTransaction(db ?? this.repo.db, async (tx) => {
			const entry = await this.repo.insert(entryData, itemsData, tx)
			if (!entry) throw GeneralLedgerError.createFailed()
			return entry
		})

		await this.invalidate(input.sourceType, input.sourceId)
		return result
	}

	async postEntry(
		input: {
			date: Date
			reference: string
			sourceType: string
			sourceId: number
			note?: string
			items: { accountId: number; debit: string; credit: string }[]
		},
		actorId: number,
		db?: DbContext,
	): Promise<EntityRef> {
		return this.create(
			{
				date: input.date,
				reference: input.reference,
				sourceType: input.sourceType,
				sourceId: input.sourceId,
				note: input.note ?? null,
				items: input.items,
			},
			actorId,
			db,
		)
	}

	async handleGetBySource(
		sourceType: string,
		sourceId: number,
	): Promise<JournalEntryWithItemsDto> {
		return record('GeneralLedgerService.handleGetBySource', async () => {
			const result = await this.getBySource(sourceType, sourceId)
			if (!result) throw GeneralLedgerError.notFound(sourceType, sourceId)
			return result
		})
	}

	async handleCreate(
		input: JournalEntryCreateDto,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('GeneralLedgerService.handleCreate', async () =>
			this.create(input, actorId),
		)
	}

	get db(): DbContext {
		return this.repo.db
	}
}

export type { JournalEntryWithItemsDto, JournalEntryDto }
