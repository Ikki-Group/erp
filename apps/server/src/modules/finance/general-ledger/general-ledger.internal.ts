import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const GeneralLedgerError = {
	notFound: (sourceType: string, sourceId: number) =>
		new NotFoundError('Journal entry not found', {
			code: 'JOURNAL_ENTRY_NOT_FOUND',
			context: { sourceType, sourceId },
		}),
	createFailed: () =>
		new InternalServerError('Journal entry creation failed', {
			code: 'JOURNAL_ENTRY_CREATE_FAILED',
		}),
	notBalanced: (debit: string, credit: string) =>
		new BadRequestError('Journal entry must be balanced', {
			code: 'JOURNAL_ENTRY_NOT_BALANCED',
			context: { debit, credit },
		}),
}
