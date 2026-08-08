import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const CompanyError = {
	notFound: () => new NotFoundError('Company settings not found', { code: 'COMPANY_NOT_FOUND' }),
	createFailed: () =>
		new InternalServerError('Company settings creation failed', {
			code: 'COMPANY_CREATE_FAILED',
		}),
	updateFailed: () =>
		new InternalServerError('Company settings update failed', {
			code: 'COMPANY_UPDATE_FAILED',
		}),
	alreadyExists: () =>
		new ConflictError('Company settings already exist', {
			code: 'COMPANY_ALREADY_EXISTS',
		}),
}
