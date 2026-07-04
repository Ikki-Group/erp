import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const SupplierError = {
	notFound: (id: number) =>
		new NotFoundError('Supplier not found', { code: 'SUPPLIER_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Supplier creation failed', { code: 'SUPPLIER_CREATE_FAILED' }),
}
