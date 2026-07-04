import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const StockDashboardError = {
	notFound: (id: number) =>
		new NotFoundError('Stock dashboard not found', { code: 'STOCK_DASHBOARD_NOT_FOUND', context: { id } }),
	queryFailed: () =>
		new InternalServerError('Stock dashboard query failed', { code: 'STOCK_DASHBOARD_QUERY_FAILED' }),
}
