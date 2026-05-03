import { record } from '@elysiajs/opentelemetry'

import type { DbClient } from '@/core/database'

import { CacheService, type CacheClient } from '@/lib/cache'

import {
	GeneralLedgerService,
	type JournalItemInput,
} from '../general-ledger/general-ledger.service'
import type { ExpenditureCreateDto, ExpenditureFilterDto } from './expenditure.dto'
import { ExpenditureRepo } from './expenditure.repo'

export class ExpenditureService {
	private readonly cache: CacheService

	constructor(
		private readonly db: DbClient,
		private readonly journal: GeneralLedgerService,
		private readonly repo: ExpenditureRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'finance.expenditure', client: cacheClient })
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async createExpenditure(input: ExpenditureCreateDto, actorId: number) {
		return record('ExpenditureService.createExpenditure', async () => {
			return this.db.transaction(async () => {
				// 1. Insert Expenditure Record
				const expenditure = await this.repo.create(input, actorId)

				// 2. Prepare Journal Items
				const items: JournalItemInput[] = [
					{
						accountId: input.targetAccountId,
						debit: input.amount.toString(),
						credit: '0',
					},
				]

				if (input.isInstallment && input.liabilityAccountId) {
					const creditAccountId =
						input.status === 'PAID' ? input.sourceAccountId : input.liabilityAccountId
					items.push({
						accountId: creditAccountId,
						debit: '0',
						credit: input.amount.toString(),
					})
				} else {
					items.push({
						accountId: input.sourceAccountId,
						debit: '0',
						credit: input.amount.toString(),
					})
				}

				// 3. Post to General Ledger
				await this.journal.postEntry(
					{
						date: input.date,
						reference: `EXP-${expenditure.id.toString().padStart(6, '0')}`,
						sourceType: 'expenditure',
						sourceId: expenditure.id,
						note: input.description ?? input.title,
						items,
					},
					actorId,
				)

				// Invalidate cache
				await this.cache.deleteMany({ keys: ['list'] })

				return expenditure
			})
		})
	}

	async listExpenditures(filter: ExpenditureFilterDto) {
		return record('ExpenditureService.listExpenditures', async () => {
			return this.repo.getListPaginated(filter)
		})
	}
}
