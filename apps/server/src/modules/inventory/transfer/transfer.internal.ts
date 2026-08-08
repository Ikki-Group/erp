import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const TransferError = {
	notFound: (id: number) =>
		new NotFoundError('Transfer request not found', {
			code: 'TRANSFER_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Transfer creation failed', {
			code: 'TRANSFER_CREATE_FAILED',
		}),
	sameLocation: () =>
		new BadRequestError('Source and destination locations must be different', {
			code: 'TRANSFER_SAME_LOCATION',
		}),
	notRequested: (id: number) =>
		new BadRequestError('Transfer must be in "requested" status to ship', {
			code: 'TRANSFER_NOT_REQUESTED',
			context: { id },
		}),
	notInTransit: (id: number) =>
		new BadRequestError('Transfer must be in "in_transit" status to receive', {
			code: 'TRANSFER_NOT_IN_TRANSIT',
			context: { id },
		}),
	alreadyReceived: (id: number) =>
		new BadRequestError('Transfer has already been received', {
			code: 'TRANSFER_ALREADY_RECEIVED',
			context: { id },
		}),
	insufficientStock: (materialId: number, locationId: number, available: string, requested: string) =>
		new BadRequestError('Insufficient stock at source location', {
			code: 'TRANSFER_INSUFFICIENT_STOCK',
			context: { materialId, locationId, available, requested },
		}),
	materialNotAssigned: (materialId: number, locationId: number) =>
		new BadRequestError('Material is not assigned to this location', {
			code: 'TRANSFER_MATERIAL_NOT_ASSIGNED',
			context: { materialId, locationId },
		}),
	receivedExceedsRequested: (materialId: number, receivedQty: string, requestedQty: string) =>
		new BadRequestError('Received quantity exceeds requested quantity', {
			code: 'TRANSFER_RECEIVED_EXCEEDS_REQUESTED',
			context: { materialId, receivedQty, requestedQty },
		}),
	lineMaterialMismatch: (materialId: number) =>
		new BadRequestError('Material not found in transfer lines', {
			code: 'TRANSFER_LINE_MATERIAL_MISMATCH',
			context: { materialId },
		}),
}
