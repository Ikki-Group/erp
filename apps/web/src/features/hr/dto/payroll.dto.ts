import { z } from 'zod'

import {
  zId,
  zMetadataDto,
  zRecordIdDto,
  zStr,
} from '@/lib/zod'

export const PayrollStatusDto = z.enum(['draft', 'approved', 'paid', 'cancelled'])
export type PayrollStatusDto = z.infer<typeof PayrollStatusDto>

export const PayrollAdjustmentTypeDto = z.enum(['addition', 'deduction'])
export type PayrollAdjustmentTypeDto = z.infer<typeof PayrollAdjustmentTypeDto>

/* --------------------------------- BATCH --------------------------------- */

export const PayrollBatchDto = z.object({
  ...zRecordIdDto.shape,
  name: zStr,
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000),
  status: PayrollStatusDto,
  totalAmount: z.string(),
  note: z.string().nullable(),
  ...zMetadataDto.shape,
})

export type PayrollBatchDto = z.infer<typeof PayrollBatchDto>

export const PayrollBatchCreateDto = z.object({
  name: zStr,
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000),
  note: zStr.optional(),
})

export type PayrollBatchCreateDto = z.infer<typeof PayrollBatchCreateDto>

/* --------------------------------- ITEM ---------------------------------- */

export const PayrollItemDto = z.object({
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

export type PayrollItemDto = z.infer<typeof PayrollItemDto>

/* ------------------------------ ADJUSTMENT ------------------------------- */

export const PayrollAdjustmentDto = z.object({
  ...zRecordIdDto.shape,
  payrollItemId: zId,
  type: PayrollAdjustmentTypeDto,
  amount: z.string(),
  reason: zStr,
  ...zMetadataDto.shape,
})

export type PayrollAdjustmentDto = z.infer<typeof PayrollAdjustmentDto>

export const PayrollAdjustmentCreateDto = z.object({
  payrollItemId: zId,
  type: PayrollAdjustmentTypeDto,
  // numeric string
  amount: zStr,
  reason: zStr,
})

export type PayrollAdjustmentCreateDto = z.infer<typeof PayrollAdjustmentCreateDto>
