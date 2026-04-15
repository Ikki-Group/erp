import z from 'zod'

import { zId, zMetadataDto, zQuerySearch, zRecordIdDto, zStr } from '@/lib/zod'

/* --------------------------------- ENTITY --------------------------------- */

export const UomDto = z.object({ ...zRecordIdDto.shape, code: zStr, ...zMetadataDto.shape })

export type UomDto = z.infer<typeof UomDto>

/* --------------------------------- FILTER --------------------------------- */

export const UomFilterDto = z.object({ q: zQuerySearch })

export type UomFilterDto = z.infer<typeof UomFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const UomMutationDto = UomDto.pick({ code: true })

export type UomMutationDto = z.infer<typeof UomMutationDto>
