import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const SalesTypeDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	isSystem: zp.bool,
	...zc.AuditBasic.shape,
})

export type SalesTypeDto = z.infer<typeof SalesTypeDto>

/* --------------------------------- FILTER --------------------------------- */

export const SalesTypeFilterDto = z.object({ q: zq.search })

export type SalesTypeFilterDto = z.infer<typeof SalesTypeFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const SalesTypeMutationDto = z.object({
	...SalesTypeDto.pick({ code: true, name: true, isSystem: true }).shape,
})

export type SalesTypeMutationDto = z.infer<typeof SalesTypeMutationDto>
export const SalesTypeUpdateDto = z.object({ ...zc.RecordId.shape, ...SalesTypeMutationDto.shape })

export type SalesTypeUpdateDto = z.infer<typeof SalesTypeUpdateDto>
