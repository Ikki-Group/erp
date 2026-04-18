import { z } from 'zod'

import { zp, zc, zq } from '@/core/validation'

export const RoleDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	description: zp.strNullable,
	permissions: z.array(zp.str),
	isSystem: zp.bool,
	...zc.MetadataBase.shape,
})
export type RoleDto = z.infer<typeof RoleDto>

const RoleMutationDto = z.object({
	code: zc.strTrim.min(2).max(32).toUpperCase(),
	name: zc.strTrim.min(2),
	description: zc.strTrimNullable,
	permissions: z.array(zp.str).default([]),
	isSystem: zp.bool.default(false),
})

export const RoleCreateDto = RoleMutationDto
export type RoleCreateDto = z.infer<typeof RoleCreateDto>

export const RoleUpdateDto = z.object({ ...zc.RecordId.shape, ...RoleMutationDto.shape })
export type RoleUpdateDto = z.infer<typeof RoleUpdateDto>

export const RoleFilterDto = z.object({ ...zq.pagination.shape, q: zq.search })
export type RoleFilterDto = z.infer<typeof RoleFilterDto>
