import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const LocationPaymentMethodError = {
	notFound: (id: number) =>
		new NotFoundError('Location payment method not found', {
			code: 'LOCATION_PAYMENT_METHOD_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Location payment method creation failed', {
			code: 'LOCATION_PAYMENT_METHOD_CREATE_FAILED',
		}),
	invalidLocationType: () =>
		new BadRequestError('Payment methods can only be configured for store locations', {
			code: 'INVALID_LOCATION_TYPE',
		}),
	locationNotFound: (id: number) =>
		new NotFoundError('Location not found', {
			code: 'LOCATION_NOT_FOUND',
			context: { id },
		}),
	paymentMethodNotFound: (id: number) =>
		new NotFoundError('Payment method not found', {
			code: 'PAYMENT_METHOD_NOT_FOUND',
			context: { id },
		}),
}
