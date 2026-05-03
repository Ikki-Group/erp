import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const SalesTypeDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	isSystem: zp.bool,
	...zc.AuditBasic.shape,
})

export type SalesTypeDto = z.infer<typeof SalesTypeDto>

/* --------------------------------- FILTER --------------------------------- */

export const SalesTypeFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
})

export type SalesTypeFilterDto = z.infer<typeof SalesTypeFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const SalesTypeMutationDto = z.object({
	code: zc.strTrim.uppercase().min(1).max(20),
	name: zc.strTrim.min(1).max(100),
	isSystem: zp.bool.default(false),
})

export const SalesTypeCreateDto = SalesTypeMutationDto
export type SalesTypeCreateDto = z.infer<typeof SalesTypeCreateDto>

export const SalesTypeUpdateDto = SalesTypeMutationDto.extend({
	...zc.RecordId.shape,
})
export type SalesTypeUpdateDto = z.infer<typeof SalesTypeUpdateDto>
