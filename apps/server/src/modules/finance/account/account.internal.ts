import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const AccountError = {
	notFound: (id: number) =>
		new NotFoundError('Account not found', { code: 'ACCOUNT_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Account creation failed', { code: 'ACCOUNT_CREATE_FAILED' }),
	updateFailed: (id: number) =>
		new InternalServerError('Account update failed', { code: 'ACCOUNT_UPDATE_FAILED', context: { id } }),
	deleteFailed: (id: number) =>
		new InternalServerError('Account deletion failed', { code: 'ACCOUNT_DELETE_FAILED', context: { id } }),
	hasChildren: (id: number) =>
		new ConflictError('Account has children, cannot delete', {
			code: 'ACCOUNT_HAS_CHILDREN',
			context: { id },
		}),
	duplicateCode: (code: string) =>
		new ConflictError('Account code already exists', {
			code: 'ACCOUNT_CODE_ALREADY_EXISTS',
			context: { code },
		}),
}
