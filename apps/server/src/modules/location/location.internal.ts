import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@/shared/errors/http-error'

/**
 * Typed error factories for the location module.
 *
 * Business context:
 * - Locations are physical sites (stores, warehouses) central to LBAC.
 * - Code is immutable after creation — enforced by excluding it from UpdateSchema.
 * - Deletion is guarded: cannot delete if user_assignments or material_locations reference it.
 * - Inactive locations reject new references (enforced by `assertActive` in the service).
 */
export const LocationError = {
	notFound: (id: number) =>
		new NotFoundError('Location not found', { code: 'LOCATION_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Location creation failed', { code: 'LOCATION_CREATE_FAILED' }),
	inactive: (id: number) =>
		new BadRequestError('Location is inactive', { code: 'LOCATION_INACTIVE', context: { id } }),
	hasReferences: (id: number) =>
		new ConflictError('Cannot delete location: it has active assignments or stock references', {
			code: 'LOCATION_HAS_REFERENCES',
			context: { id },
		}),
}
