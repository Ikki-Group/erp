import { InternalServerError } from '@/shared/errors/http-error'

export const FinanceReportingError = {
	queryFailed: () =>
		new InternalServerError('Finance reporting query failed', {
			code: 'FINANCE_REPORTING_QUERY_FAILED',
		}),
}
