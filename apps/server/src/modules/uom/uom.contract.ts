/**
 * UOM DTOs — HTTP boundary schemas
 */

import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

/* -------------------------------- RESPONSE -------------------------------- */

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

const UomMutationDto = z.object({
	code: zc.strTrim
		.min(1)
		.max(10)
		.transform((v) => v.toUpperCase()),
})

export const UomCreateDto = UomMutationDto
export type UomCreateDto = z.infer<typeof UomCreateDto>

export const UomUpdateDto = z.object({
	...zc.RecordId.shape,
	...UomMutationDto.shape,
})
export type UomUpdateDto = z.infer<typeof UomUpdateDto>
