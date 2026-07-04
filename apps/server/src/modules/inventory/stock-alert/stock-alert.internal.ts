import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const StockAlertError = {
	notFound: (id: number) =>
		new NotFoundError('Stock alert not found', { code: 'STOCK_ALERT_NOT_FOUND', context: { id } }),
	queryFailed: () =>
		new InternalServerError('Stock alert query failed', { code: 'STOCK_ALERT_QUERY_FAILED' }),
}
