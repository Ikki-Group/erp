import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const CompanySettingsError = {
	notFound: (id: number) =>
		new NotFoundError('Company settings not found', { code: 'COMPANY_SETTINGS_NOT_FOUND', context: { id } }),
	notConfigured: () =>
		new InternalServerError('Company settings not configured', { code: 'COMPANY_SETTINGS_NOT_CONFIGURED' }),
	alreadyExists: () =>
		new InternalServerError('Company settings already exist. Use update instead.', { code: 'COMPANY_SETTINGS_ALREADY_EXISTS' }),
	createFailed: () =>
		new InternalServerError('Company settings creation failed', { code: 'COMPANY_SETTINGS_CREATE_FAILED' }),
}
