import { z } from 'zod'

import { defineContract } from '@/shared/contract/define-contract'
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

/* -------------------------------- CONTRACT -------------------------------- */

export const roleContract = defineContract({
	feature: 'iam',
	entity: 'role',
	prefix: '/iam/role',
	dtoSource: 'iam/role/role.contract.ts',
	dtos: { RoleDto, RoleFilterDto, RoleCreateDto, RoleUpdateDto },
	endpoints: {
		list: { get: '/list', query: RoleFilterDto, ok: [RoleDto] },
		detail: { get: '/detail', query: zc.RecordId, ok: RoleDto },
		create: { post: '/create', body: RoleCreateDto, ok: zc.RecordId },
		update: { put: '/update', body: RoleUpdateDto, ok: zc.RecordId },
		remove: { delete: '/remove', query: zc.RecordId, ok: zc.RecordId },
	},
})
