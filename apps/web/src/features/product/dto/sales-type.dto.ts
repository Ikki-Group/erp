import { zStr, zBool, zId, zQuerySearch, zMetadataDto } from '@/lib/zod'

import z from 'zod'

/* --------------------------------- ENTITY --------------------------------- */

export const SalesTypeDto = z.object({
	id: zId,
	code: zStr,
	name: zStr,
	isSystem: zBool,
	...zMetadataDto.shape,
})

export type SalesTypeDto = z.infer<typeof SalesTypeDto>

/* --------------------------------- FILTER --------------------------------- */

export const SalesTypeFilterDto = z.object({ q: zQuerySearch })

export type SalesTypeFilterDto = z.infer<typeof SalesTypeFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const SalesTypeMutationDto = z.object({
	...SalesTypeDto.pick({ code: true, name: true, isSystem: true }).shape,
})

export type SalesTypeMutationDto = z.infer<typeof SalesTypeMutationDto>
