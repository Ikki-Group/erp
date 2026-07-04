import { InternalServerError } from '@/shared/errors/http-error'

export const SettingsError = {
	summaryFailed: () =>
		new InternalServerError('Failed to fetch settings summary', {
			code: 'SETTINGS_SUMMARY_FAILED',
		}),
}
