import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const CustomerError = {
	notFound: (id: number) =>
		new NotFoundError('Customer not found', { code: 'CUSTOMER_NOT_FOUND', context: { id } }),
	notFoundByPhone: (phone: string) =>
		new NotFoundError('Customer not found', {
			code: 'CUSTOMER_NOT_FOUND',
			context: { phone },
		}),
	createFailed: () =>
		new InternalServerError('Customer creation failed', { code: 'CUSTOMER_CREATE_FAILED' }),
	insufficientPoints: () =>
		new InternalServerError('Insufficient points balance', { code: 'INSUFFICIENT_POINTS' }),
}
