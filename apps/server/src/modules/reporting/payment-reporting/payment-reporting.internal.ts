import { InternalServerError } from '@/shared/errors/http-error'

export const PaymentReportingError = {
	queryFailed: () =>
		new InternalServerError('Payment reporting query failed', {
			code: 'PAYMENT_REPORTING_QUERY_FAILED',
		}),
}
