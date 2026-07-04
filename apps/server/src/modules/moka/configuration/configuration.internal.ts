import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const MokaConfigurationError = {
	notFound: (id: number) =>
		new NotFoundError('Moka configuration not found', { code: 'MOKA_CONFIGURATION_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Moka configuration creation failed', { code: 'MOKA_CONFIGURATION_CREATE_FAILED' }),
	updateFailed: () =>
		new InternalServerError('Moka configuration update failed', { code: 'MOKA_CONFIGURATION_UPDATE_FAILED' }),
	locationAlreadyHasConfig: (locationId: number) =>
		new ConflictError(`Location ${locationId} already has a Moka configuration`, {
			code: 'MOKA_CONFIGURATION_LOCATION_EXISTS',
			context: { locationId },
		}),
}
