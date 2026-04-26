import { record } from '@elysiajs/opentelemetry'

import type { JournalEntryInput } from '../repo/general-ledger.repo'
import { GeneralLedgerRepo as GLRepo } from '../repo/general-ledger.repo'

import Decimal from 'decimal.js'

export type {
	JournalItemInput,
	JournalEntryWithItems,
	JournalEntry,
	JournalItem,
	JournalEntryInput,
} from '../repo/general-ledger.repo'

export class GeneralLedgerService {
	constructor(private readonly repo = new GLRepo()) {}

	/* --------------------------------- HANDLER -------------------------------- */

	async postEntry(input: JournalEntryInput, actorId: number) {
		return record('GeneralLedgerService.postEntry', async () => {
			const totalDebit = input.items.reduce((sum, item) => sum.plus(item.debit), new Decimal(0))
			const totalCredit = input.items.reduce((sum, item) => sum.plus(item.credit), new Decimal(0))

			if (!totalDebit.eq(totalCredit)) {
				throw new Error(
					`Journal entry must be balanced. Total Debit: ${totalDebit.toString()}, Total Credit: ${totalCredit.toString()}`,
				)
			}

			return this.repo.postEntry(input, actorId)
		})
	}

	async getEntryBySource(sourceType: string, sourceId: number) {
		return record('GeneralLedgerService.getEntryBySource', async () => {
			return this.repo.getEntryBySource(sourceType, sourceId)
		})
	}
}
