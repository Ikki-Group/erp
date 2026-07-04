import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const ExpenditureError = {
	notFound: (id: number) =>
		new NotFoundError('Expenditure not found', { code: 'EXPENDITURE_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Expenditure creation failed', { code: 'EXPENDITURE_CREATE_FAILED' }),
}
