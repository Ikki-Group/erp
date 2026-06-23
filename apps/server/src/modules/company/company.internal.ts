import { NotFoundError } from '@/shared/errors/http-error'

export const CompanyError = {
	notFound: () =>
		new NotFoundError('Company settings not found', { code: 'COMPANY_NOT_FOUND' }),
	updateFailed: () =>
		new NotFoundError('Company settings update failed', { code: 'COMPANY_UPDATE_FAILED' }),
}
