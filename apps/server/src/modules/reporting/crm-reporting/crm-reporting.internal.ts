import { InternalServerError } from '@/shared/errors/http-error'

export const CrmReportingError = {
	queryFailed: () =>
		new InternalServerError('CRM reporting query failed', {
			code: 'CRM_REPORTING_QUERY_FAILED',
		}),
}
