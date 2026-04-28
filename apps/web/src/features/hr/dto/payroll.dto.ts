import { z } from 'zod'

import { zp, zc } from '@/lib/validation'

export const PayrollStatusDto = z.enum(['draft', 'approved', 'paid', 'cancelled'])
export type PayrollStatusDto = z.infer<typeof PayrollStatusDto>

export const PayrollAdjustmentTypeDto = z.enum(['addition', 'deduction'])
export type PayrollAdjustmentTypeDto = z.infer<typeof PayrollAdjustmentTypeDto>

/* --------------------------------- BATCH --------------------------------- */

export const PayrollBatchDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	periodMonth: z.number().int().min(1).max(12),
	periodYear: z.number().int().min(2000),
	status: PayrollStatusDto,
	totalAmount: z.string(),
	note: z.string().nullable(),
	...zc.AuditFull.shape,
})

export type PayrollBatchDto = z.infer<typeof PayrollBatchDto>

export const PayrollBatchCreateDto = z.object({
	name: zp.str,
	periodMonth: z.number().int().min(1).max(12),
	periodYear: z.number().int().min(2000),
	note: zp.str.optional(),
})

export type PayrollBatchCreateDto = z.infer<typeof PayrollBatchCreateDto>

/* --------------------------------- ITEM ---------------------------------- */

export const PayrollItemDto = z.object({
	...zc.RecordId.shape,
	batchId: zp.id,
	employeeId: zp.id,
	baseSalary: z.string(),
	adjustmentsAmount: z.string(),
	serviceChargeAmount: z.string(),
	totalAmount: z.string(),
	note: z.string().nullable(),
	...zc.AuditFull.shape,
})

export type PayrollItemDto = z.infer<typeof PayrollItemDto>

/* ------------------------------ ADJUSTMENT ------------------------------- */

export const PayrollAdjustmentDto = z.object({
	...zc.RecordId.shape,
	payrollItemId: zp.id,
	type: PayrollAdjustmentTypeDto,
	amount: z.string(),
	reason: zp.str,
	...zc.AuditFull.shape,
})

export type PayrollAdjustmentDto = z.infer<typeof PayrollAdjustmentDto>

export const PayrollAdjustmentCreateDto = z.object({
	payrollItemId: zp.id,
	type: PayrollAdjustmentTypeDto,
	// numeric string
	amount: zp.str,
	reason: zp.str,
})

export type PayrollAdjustmentCreateDto = z.infer<typeof PayrollAdjustmentCreateDto>
