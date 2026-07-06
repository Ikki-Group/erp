import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

/* --------------------------------- ENTITY --------------------------------- */

export const RoleDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	description: zp.str.nullable(),
	permissions: z.array(zp.str),
	isSystem: zp.bool,
	...zc.AuditBasic.shape,
})
export type RoleDto = z.infer<typeof RoleDto>

/* ---------------------------------- HTTP ---------------------------------- */

export const RoleFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type RoleFilterDto = z.infer<typeof RoleFilterDto>

const RoleMutationDto = z.object({
	code: zc.strTrim.min(2).max(32).toUpperCase(),
	name: zc.strTrim.min(2),
	description: zc.strTrimNullable,
	permissions: z.array(zp.str).default([]),
	isSystem: zp.bool.default(false),
})

export const RoleCreateDto = RoleMutationDto
export type RoleCreateDto = z.infer<typeof RoleCreateDto>

export const RoleUpdateDto = z.object({
	id: zp.id,
	...RoleMutationDto.shape,
})
export type RoleUpdateDto = z.infer<typeof RoleUpdateDto>

