import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const UomDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	...zc.AuditBasic.shape,
})

export type UomDto = z.infer<typeof UomDto>

/* --------------------------------- FILTER --------------------------------- */

export const UomFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
})

export type UomFilterDto = z.infer<typeof UomFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const UomMutationDto = z.object({
	code: zc.strTrim.uppercase().min(1).max(10),
})

export type UomMutationDto = z.infer<typeof UomMutationDto>
export const UomUpdateDto = z.object({ ...zc.RecordId.shape, ...UomMutationDto.shape })

export type UomUpdateDto = z.infer<typeof UomUpdateDto>
