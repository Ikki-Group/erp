import { ConflictError, NotFoundError } from '@/shared/errors/http-error'

export const SupplierError = {
	notFound: (id: number) =>
		new NotFoundError(`Supplier with ID ${id} not found`, { code: 'SUPPLIER_NOT_FOUND' }),
	codeExists: (code: string) =>
		new ConflictError(`Supplier with code ${code} already exists`, { code: 'SUPPLIER_CODE_EXISTS' }),
	createFailed: () =>
		new NotFoundError('Supplier creation failed', { code: 'SUPPLIER_CREATE_FAILED' }),
}
