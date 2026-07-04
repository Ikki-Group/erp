import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const PaymentProviderError = {
	notFound: (id: number) =>
		new NotFoundError('Payment provider not found', {
			code: 'PAYMENT_PROVIDER_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Payment provider creation failed', {
			code: 'PAYMENT_PROVIDER_CREATE_FAILED',
		}),
	isSystem: (id: number) =>
		new NotFoundError('Cannot mutate a system payment provider', {
			code: 'PAYMENT_PROVIDER_IS_SYSTEM',
			context: { id },
		}),
}
