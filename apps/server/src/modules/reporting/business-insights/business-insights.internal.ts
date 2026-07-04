import { InternalServerError } from '@/shared/errors/http-error'

export const BusinessInsightsError = {
	queryFailed: () =>
		new InternalServerError('Business insights query failed', {
			code: 'BUSINESS_INSIGHTS_QUERY_FAILED',
		}),
}
