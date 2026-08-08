import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Response ───

export const RoleDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	isSystem: zp.bool,
	permissions: z.array(zp.str),
	...zc.AuditBasic.shape,
})
export type RoleDto = z.infer<typeof RoleDto>

// ─── Filter ───

export const RoleFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type RoleFilterDto = z.infer<typeof RoleFilterDto>

// ─── Mutation Base ───

const RoleMutationDto = z.object({
	code: zc.strTrim.min(2).max(50),
	name: zc.strTrim.min(2).max(255),
	permissions: z.array(z.string()).default([]),
})

// ─── Create / Update ───

export const RoleCreateDto = RoleMutationDto
export type RoleCreateDto = z.infer<typeof RoleCreateDto>

export const RoleUpdateDto = z.object({
	id: zp.id,
	...RoleMutationDto.shape,
})
export type RoleUpdateDto = z.infer<typeof RoleUpdateDto>
