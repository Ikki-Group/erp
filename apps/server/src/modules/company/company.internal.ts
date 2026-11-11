import { InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

// Singleton settings: no id-keyed errors, so the shared entity factory does not apply.
export const CompanyError = {
	notFound: () => new NotFoundError('Company settings not found', { code: 'COMPANY_NOT_FOUND' }),
	updateFailed: () =>
		new InternalServerError('Company settings update failed', {
			code: 'COMPANY_UPDATE_FAILED',
		}),
}
