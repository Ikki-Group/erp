import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const SalesTypeError = {
	notFound: (id: number) =>
		new NotFoundError('Sales type not found', { code: 'SALES_TYPE_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Sales type creation failed', { code: 'SALES_TYPE_CREATE_FAILED' }),
	isSystem: () =>
		new BadRequestError('Cannot mutate a system sales type', { code: 'SALES_TYPE_IS_SYSTEM' }),
}
