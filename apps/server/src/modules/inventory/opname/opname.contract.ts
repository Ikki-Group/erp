import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const OpnameStatusEnum = z.enum(['draft', 'in_progress', 'completed', 'cancelled'])
export type OpnameStatusEnum = z.infer<typeof OpnameStatusEnum>

// ─── Response: Opname Line ───

export const OpnameLineDto = z.object({
	id: zp.id,
	opnameId: zp.id,
	materialId: zp.id,
	systemQty: zp.str,
	actualQty: zp.str,
	reason: zp.str.nullable(),
})
export type OpnameLineDto = z.infer<typeof OpnameLineDto>

// ─── Response: Opname ───

export const OpnameDto = z.object({
	id: zp.id,
	opnameNo: zp.str,
	locationId: zp.id,
	status: OpnameStatusEnum,
	startedAt: zp.datetime.nullable(),
	completedAt: zp.datetime.nullable(),
	conductedBy: zp.num.nullable(),
	...zc.AuditBasic.shape,
})
export type OpnameDto = z.infer<typeof OpnameDto>

// ─── Response: Opname Detail (with lines) ───

export const OpnameDetailDto = z.object({
	...OpnameDto.shape,
	lines: z.array(OpnameLineDto),
})
export type OpnameDetailDto = z.infer<typeof OpnameDetailDto>

// ─── Input: Create ───

export const OpnameCreateDto = z.object({
	locationId: z.number().int().positive(),
	notes: zc.strTrimNullable.optional(),
})
export type OpnameCreateDto = z.infer<typeof OpnameCreateDto>

// ─── Input: Update Counts ───

const OpnameCountLineDto = z.object({
	materialId: z.number().int().positive(),
	countedQty: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a non-negative number'),
	reason: zc.strTrimNullable.optional(),
})

export const OpnameUpdateCountsDto = z.object({
	opnameId: z.number().int().positive(),
	lines: z.array(OpnameCountLineDto).min(1),
})
export type OpnameUpdateCountsDto = z.infer<typeof OpnameUpdateCountsDto>

// ─── Input: Approve ───

export const OpnameApproveDto = z.object({
	opnameId: z.number().int().positive(),
})
export type OpnameApproveDto = z.infer<typeof OpnameApproveDto>

// ─── Filter: List ───

export const OpnameFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive().optional(),
	status: OpnameStatusEnum.optional(),
})
export type OpnameFilterDto = z.infer<typeof OpnameFilterDto>

// ─── Query: Detail ───

export const OpnameDetailQueryDto = z.object({
	id: z.coerce.number().int().positive(),
})
export type OpnameDetailQueryDto = z.infer<typeof OpnameDetailQueryDto>
