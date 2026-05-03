import { z } from 'zod'

import { payrollAdjustmentTypeEnum, payrollStatusEnum } from '@/db/schema'

import { zc, zp } from '@/lib/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const PayrollStatusEnum = z.enum(payrollStatusEnum.enumValues)
export type PayrollStatus = z.infer<typeof PayrollStatusEnum>

export const PayrollAdjustmentTypeEnum = z.enum(payrollAdjustmentTypeEnum.enumValues)
export type PayrollAdjustmentType = z.infer<typeof PayrollAdjustmentTypeEnum>

/* --------------------------------- BATCH --------------------------------- */

export const PayrollBatchDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	periodMonth: zp.num.int().min(1).max(12),
	periodYear: zp.num.int().min(2000),
	status: PayrollStatusEnum,
	totalAmount: zp.decimal,
	note: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type PayrollBatchDto = z.infer<typeof PayrollBatchDto>

export const PayrollBatchCreateDto = z.object({
	name: zc.strTrim.min(1).max(100),
	periodMonth: zp.num.int().min(1).max(12),
	periodYear: zp.num.int().min(2000),
	note: zc.strTrimNullable,
})
export type PayrollBatchCreateDto = z.infer<typeof PayrollBatchCreateDto>

/* --------------------------------- ITEM ---------------------------------- */

export const PayrollItemDto = z.object({
	...zc.RecordId.shape,
	batchId: zp.id,
	employeeId: zp.id,
	baseSalary: zp.decimal,
	adjustmentsAmount: zp.decimal,
	serviceChargeAmount: zp.decimal,
	totalAmount: zp.decimal,
	note: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type PayrollItemDto = z.infer<typeof PayrollItemDto>

/* ------------------------------ ADJUSTMENT ------------------------------- */

export const PayrollAdjustmentDto = z.object({
	...zc.RecordId.shape,
	payrollItemId: zp.id,
	type: PayrollAdjustmentTypeEnum,
	amount: zp.decimal,
	reason: zp.str,
	...zc.AuditBasic.shape,
})
export type PayrollAdjustmentDto = z.infer<typeof PayrollAdjustmentDto>

export const PayrollAdjustmentCreateDto = z.object({
	payrollItemId: zp.id,
	type: PayrollAdjustmentTypeEnum,
	amount: zp.decimal,
	reason: zc.strTrim.min(1).max(255),
})
export type PayrollAdjustmentCreateDto = z.infer<typeof PayrollAdjustmentCreateDto>
