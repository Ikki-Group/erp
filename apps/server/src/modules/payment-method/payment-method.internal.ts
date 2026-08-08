import { paymentMethods } from '@/db/schema/pos.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

import type { PaymentMethodCreateDto } from './payment-method.contract.ts'

// ─── Error Factories ───

export const PaymentMethodError = {
	notFound: (id: number) =>
		new NotFoundError('Payment method not found', {
			code: 'PAYMENT_METHOD_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Payment method creation failed', {
			code: 'PAYMENT_METHOD_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Payment method update failed', {
			code: 'PAYMENT_METHOD_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Payment method deletion failed', {
			code: 'PAYMENT_METHOD_DELETE_FAILED',
			context: { id },
		}),
}

export const LocationAssignmentError = {
	assignFailed: () =>
		new InternalServerError('Payment method location assignment failed', {
			code: 'PAYMENT_METHOD_ASSIGN_FAILED',
		}),
	notAssigned: (paymentMethodId: number, locationId: number) =>
		new NotFoundError('Payment method is not assigned to this location', {
			code: 'PAYMENT_METHOD_NOT_ASSIGNED',
			context: { paymentMethodId, locationId },
		}),
	alreadyAssigned: (paymentMethodId: number, locationId: number) =>
		new ConflictError('Payment method is already assigned to this location', {
			code: 'PAYMENT_METHOD_ALREADY_ASSIGNED',
			context: { paymentMethodId, locationId },
		}),
}

// ─── Unique Constraint Fields ───

export const uniqueFields = defineConflictFields<PaymentMethodCreateDto>()([
	{
		field: 'code',
		column: paymentMethods.code,
		message: 'Payment method code already exists',
		code: 'PAYMENT_METHOD_CODE_EXISTS',
	},
])
