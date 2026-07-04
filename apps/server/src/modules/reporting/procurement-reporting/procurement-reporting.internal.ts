import { InternalServerError } from '@/shared/errors/http-error'

export const ProcurementReportingError = {
	queryFailed: () =>
		new InternalServerError('Procurement reporting query failed', {
			code: 'PROCUREMENT_REPORTING_QUERY_FAILED',
		}),
}
