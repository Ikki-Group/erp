import { InternalServerError } from '@/shared/errors/http-error'

export const AnalyticsError = {
	queryFailed: (operation: string) =>
		new InternalServerError(`Analytics query failed: ${operation}`, { code: 'ANALYTICS_QUERY_FAILED' }),
}
