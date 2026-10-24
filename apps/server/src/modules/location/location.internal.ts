import { defineEntityErrors } from '@/shared/errors/entity-errors.ts'
import { ConflictError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const LocationError = {
	...defineEntityErrors('Location', 'LOCATION'),
	nameExists: () =>
		new ConflictError('Location name already exists', { code: 'LOCATION_NAME_EXISTS' }),
	codeExists: () =>
		new ConflictError('Location code already exists', { code: 'LOCATION_CODE_EXISTS' }),
}
