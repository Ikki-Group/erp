import { record } from '@elysiajs/opentelemetry'

import { db } from '@/db'

import type { ExpenditureCreateDto, ExpenditureFilterDto } from '../dto/expenditure.dto'
import { ExpenditureRepo } from '../repo/expenditure.repo'
import { GeneralLedgerService, type JournalItemInput } from './general-ledger.service'

export class ExpenditureService {
	constructor(
		private readonly journal: GeneralLedgerService,
		private readonly repo = new ExpenditureRepo(),
	) {}

	/* --------------------------------- HANDLER -------------------------------- */

	async createExpenditure(input: ExpenditureCreateDto, actorId: number) {
		return record('ExpenditureService.createExpenditure', async () => {
			return db.transaction(async () => {
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
