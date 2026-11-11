import { InternalServerError, NotFoundError } from './http-error.ts'

/**
 * Standard error factories for a CRUD entity.
 * `entity` is the human label ("Menu item"), `codePrefix` the API code prefix ("MENU_ITEM").
 * Slice-specific errors are spread alongside: `{ ...defineEntityErrors('Role', 'ROLE'), ... }`.
 */
export function defineEntityErrors(entity: string, codePrefix: string) {
	return {
		notFound: (id: number) =>
			new NotFoundError(`${entity} not found`, {
				code: `${codePrefix}_NOT_FOUND`,
				context: { id },
			}),
		createFailed: () =>
			new InternalServerError(`${entity} creation failed`, { code: `${codePrefix}_CREATE_FAILED` }),
		updateFailed: (id: number) =>
			new InternalServerError(`${entity} update failed`, {
				code: `${codePrefix}_UPDATE_FAILED`,
				context: { id },
			}),
		deleteFailed: (id: number) =>
			new InternalServerError(`${entity} deletion failed`, {
				code: `${codePrefix}_DELETE_FAILED`,
				context: { id },
			}),
	}
}
