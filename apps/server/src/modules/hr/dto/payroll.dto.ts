import z from 'zod'

import { zId, zStr, zMetadataDto, zRecordIdDto } from '@/core/validation'
import { payrollAdjustmentTypeEnum, payrollStatusEnum } from '@/db/schema/hr'

export const payrollStatusSchema = z.enum(payrollStatusEnum.enumValues)
export type PayrollStatus = z.infer<typeof payrollStatusSchema>

export const payrollAdjustmentTypeSchema = z.enum(payrollAdjustmentTypeEnum.enumValues)
export type PayrollAdjustmentType = z.infer<typeof payrollAdjustmentTypeSchema>

/* --------------------------------- BATCH --------------------------------- */

export const payrollBatchSchema = z.object({
	...zRecordIdDto.shape,
	name: zStr,
	periodMonth: z.number().int().min(1).max(12),
	periodYear: z.number().int().min(2000),
	status: payrollStatusSchema,
	totalAmount: z.string(),
	note: z.string().nullable(),
	...zMetadataDto.shape,
})

export type PayrollBatchDto = z.infer<typeof payrollBatchSchema>

export const payrollBatchCreateSchema = z.object({
	name: zStr,
	periodMonth: z.number().int().min(1).max(12),
	periodYear: z.number().int().min(2000),
	note: zStr.optional(),
})

export type PayrollBatchCreateDto = z.infer<typeof payrollBatchCreateSchema>

/* --------------------------------- ITEM ---------------------------------- */

export const payrollItemSchema = z.object({
	...zRecordIdDto.shape,
	batchId: zId,
	employeeId: zId,
	baseSalary: z.string(),
	adjustmentsAmount: z.string(),
	serviceChargeAmount: z.string(),
	totalAmount: z.string(),
	note: z.string().nullable(),
	...zMetadataDto.shape,
})

export type PayrollItemDto = z.infer<typeof payrollItemSchema>

/* ------------------------------ ADJUSTMENT ------------------------------- */

export const payrollAdjustmentSchema = z.object({
	...zRecordIdDto.shape,
	payrollItemId: zId,
	type: payrollAdjustmentTypeSchema,
	amount: z.string(),
	reason: zStr,
	...zMetadataDto.shape,
})

export type PayrollAdjustmentDto = z.infer<typeof payrollAdjustmentSchema>

export const payrollAdjustmentCreateSchema = z.object({
	payrollItemId: zId,
	type: payrollAdjustmentTypeSchema,
	amount: zStr, // numeric string
	reason: zStr,
})

export type PayrollAdjustmentCreateDto = z.infer<typeof payrollAdjustmentCreateSchema>
