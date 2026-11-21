import { vouchers } from '@/db/schema/pos.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

import type { VoucherCreateDto } from './voucher.contract.ts'

// ─── Error Factories ───

export const VoucherError = {
	notFound: (id: number) =>
		new NotFoundError('Voucher not found', {
			code: 'VOUCHER_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Voucher creation failed', {
			code: 'VOUCHER_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Voucher update failed', {
			code: 'VOUCHER_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Voucher deletion failed', {
			code: 'VOUCHER_DELETE_FAILED',
			context: { id },
		}),
}

// ─── Validation Reasons ───

export const VoucherValidationReason = {
	NOT_FOUND: 'NOT_FOUND',
	INACTIVE: 'INACTIVE',
	EXPIRED: 'EXPIRED',
	USAGE_LIMIT_REACHED: 'USAGE_LIMIT_REACHED',
	BELOW_MIN_PURCHASE: 'BELOW_MIN_PURCHASE',
} as const

// ─── Unique Constraint Fields ───

export const uniqueFields = defineConflictFields<VoucherCreateDto>()([
	{
		field: 'code',
		column: vouchers.code,
		message: 'Voucher code already exists',
		code: 'VOUCHER_CODE_EXISTS',
	},
])
