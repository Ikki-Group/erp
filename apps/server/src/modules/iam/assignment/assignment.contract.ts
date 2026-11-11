import { z } from 'zod'

import { zp, zq } from '@/shared/schema/index.ts'

// ─── Response ───

export const AssignmentDto = z.object({
	id: zp.id,
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id.nullable(),
})
export type AssignmentDto = z.infer<typeof AssignmentDto>

// ─── Filter ───

export const AssignmentFilterDto = z.object({
	...zq.pagination.shape,
	userId: z.coerce.number().int().positive(),
})
export type AssignmentFilterDto = z.infer<typeof AssignmentFilterDto>

// ─── Mutations ───

export const AssignmentCreateDto = z.object({
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id.nullable(),
})
export type AssignmentCreateDto = z.infer<typeof AssignmentCreateDto>

export const AssignmentRemoveDto = z.object({
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id.nullable(),
})
export type AssignmentRemoveDto = z.infer<typeof AssignmentRemoveDto>
