import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const PaymentError = {
	notFound: (id: number) =>
		new NotFoundError('Payment not found', { code: 'PAYMENT_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Payment creation failed', { code: 'PAYMENT_CREATE_FAILED' }),
}
