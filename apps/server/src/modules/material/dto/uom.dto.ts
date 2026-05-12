/**
 * UOM DTOs — HTTP boundary schemas
 */

import { z, zc, zq } from '@ikki/api-contract/validation'

import { UomEntity } from '../domain/uom.entity'

/* -------------------------------- RESPONSE -------------------------------- */

export const UomDto = UomEntity
export type UomDto = z.infer<typeof UomDto>

/* --------------------------------- FILTER --------------------------------- */

export const UomFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type UomFilterDto = z.infer<typeof UomFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const UomMutationDto = z.object({
	code: zc.strTrim.min(1).max(10).toUpperCase(),
})
export type UomMutationDto = z.infer<typeof UomMutationDto>
