import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const UomError = {
	notFound: (id: number) =>
		new NotFoundError('UOM not found', { code: 'UOM_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('UOM creation failed', { code: 'UOM_CREATE_FAILED' }),
}
