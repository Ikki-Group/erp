import { paymentMethods } from '@/db/schema/pos.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { defineEntityErrors } from '@/shared/errors/entity-errors.ts'
import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

import type { PaymentMethodCreateDto } from './payment-method.contract.ts'

// ─── Error Factories ───

export const PaymentMethodError = defineEntityErrors('Payment method', 'PAYMENT_METHOD')

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
