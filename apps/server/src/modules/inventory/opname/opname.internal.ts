import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const OpnameError = {
	notFound: (id: number) =>
		new NotFoundError('Opname not found', {
			code: 'OPNAME_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Opname creation failed', {
			code: 'OPNAME_CREATE_FAILED',
		}),
	notDraft: (id: number) =>
		new BadRequestError('Opname must be in "draft" status to perform this action', {
			code: 'OPNAME_NOT_DRAFT',
			context: { id },
		}),
	alreadyApproved: (id: number) =>
		new BadRequestError('Opname has already been approved', {
			code: 'OPNAME_ALREADY_APPROVED',
			context: { id },
		}),
	noMaterialsAtLocation: (locationId: number) =>
		new BadRequestError('No materials assigned to this location', {
			code: 'OPNAME_NO_MATERIALS_AT_LOCATION',
			context: { locationId },
		}),
	lineNotFound: (opnameId: number, materialId: number) =>
		new BadRequestError('Opname line not found for material', {
			code: 'OPNAME_LINE_NOT_FOUND',
			context: { opnameId, materialId },
		}),
}
