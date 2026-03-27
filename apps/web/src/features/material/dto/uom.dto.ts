import z from 'zod'

import { zStr, zId, zQuerySearch, zMetadataDto } from '@/lib/zod'

/* --------------------------------- ENTITY --------------------------------- */

export const UomDto = z.object({ id: zId, code: zStr, ...zMetadataDto.shape })

export type UomDto = z.infer<typeof UomDto>

/* --------------------------------- FILTER --------------------------------- */

export const UomFilterDto = z.object({ search: zQuerySearch })

export type UomFilterDto = z.infer<typeof UomFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const UomMutationDto = z.object({ ...UomDto.pick({ code: true }).shape })

export type UomMutationDto = z.infer<typeof UomMutationDto>
