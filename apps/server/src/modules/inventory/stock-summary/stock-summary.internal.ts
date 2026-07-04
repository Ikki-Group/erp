import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const StockSummaryError = {
	notFound: (id: number) =>
		new NotFoundError('Stock summary not found', { code: 'STOCK_SUMMARY_NOT_FOUND', context: { id } }),
	generateFailed: () =>
		new InternalServerError('Stock summary generation failed', { code: 'STOCK_SUMMARY_GENERATE_FAILED' }),
	removeFailed: () =>
		new InternalServerError('Stock summary removal failed', { code: 'STOCK_SUMMARY_REMOVE_FAILED' }),
}
