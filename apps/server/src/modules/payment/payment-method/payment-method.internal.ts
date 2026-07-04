import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const PaymentMethodError = {
	notFound: (id: number) =>
		new NotFoundError('Payment method not found', {
			code: 'PAYMENT_METHOD_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Payment method creation failed', {
			code: 'PAYMENT_METHOD_CREATE_FAILED',
		}),
}
