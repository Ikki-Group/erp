import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const MokaScrapHistoryError = {
	notFound: (id: number) =>
		new NotFoundError('Moka scrap history not found', { code: 'MOKA_SCRAP_HISTORY_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Moka scrap history creation failed', { code: 'MOKA_SCRAP_HISTORY_CREATE_FAILED' }),
}
