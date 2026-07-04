import { InternalServerError } from '@/shared/errors/http-error'

export const SalesReportingError = {
	queryFailed: () =>
		new InternalServerError('Sales reporting query failed', {
			code: 'SALES_REPORTING_QUERY_FAILED',
		}),
}
