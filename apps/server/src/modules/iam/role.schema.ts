import { z } from 'zod'

import { zc, zp, zq } from '@/shared/validation'

/* ---------------------------------- BASE ---------------------------------- */

export const RoleSchema = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	description: zp.str.nullable(),
	permissions: z.array(zp.str),
	isSystem: zp.bool,
	...zc.AuditBasic.shape,
})
export type RoleSchema = z.infer<typeof RoleSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const RoleMutationSchema = z.object({
	code: zc.strTrim.min(2).max(32).toUpperCase(),
	name: zc.strTrim.min(2),
	description: zc.strTrimNullable,
	permissions: z.array(zp.str).default([]),
	isSystem: zp.bool.default(false),
})
export type RoleMutationSchema = z.infer<typeof RoleMutationSchema>

/* --------------------------------- FILTER --------------------------------- */

export const RoleFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type RoleFilterSchema = z.infer<typeof RoleFilterSchema>
