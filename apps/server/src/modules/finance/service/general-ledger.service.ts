import { record } from '@elysiajs/opentelemetry'
import type { JournalEntryInput } from '../repo/general-ledger.repo'
import { GeneralLedgerRepo as GLRepo } from '../repo/general-ledger.repo'

export type { JournalItemInput, JournalEntryWithItems, JournalEntry, JournalItem, JournalEntryInput } from '../repo/general-ledger.repo'

export class GeneralLedgerService {
	constructor(private readonly repo = new GLRepo()) {}

	/* --------------------------------- HANDLER -------------------------------- */

	async postEntry(input: JournalEntryInput, actorId: number) {
		return record('GeneralLedgerService.postEntry', async () => {
			const totalDebit = input.items.reduce((sum, item) => sum + Number(item.debit), 0)
			const totalCredit = input.items.reduce((sum, item) => sum + Number(item.credit), 0)

			if (Math.abs(totalDebit - totalCredit) > 0.01) {
				throw new Error(
					`Journal entry must be balanced. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}`,
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
