import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const AssignmentError = {
	alreadyAssigned: (materialId: number, locationId: number) =>
		new ConflictError('Material is already assigned to this location', {
			code: 'MATERIAL_ALREADY_ASSIGNED',
			context: { materialId, locationId },
		}),
	notAssigned: (materialId: number, locationId: number) =>
		new NotFoundError('Material is not assigned to this location', {
			code: 'MATERIAL_NOT_ASSIGNED',
			context: { materialId, locationId },
		}),
	assignFailed: () =>
		new InternalServerError('Material assignment failed', { code: 'MATERIAL_ASSIGN_FAILED' }),
}
