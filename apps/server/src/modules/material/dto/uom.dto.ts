import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const UomDto = z.object({ id: zPrimitive.id, code: zPrimitive.str, ...zSchema.metadata.shape })

export type UomDto = z.infer<typeof UomDto>

/* --------------------------------- FILTER --------------------------------- */

export const UomFilterDto = z.object({ search: zHttp.query.search })

export type UomFilterDto = z.infer<typeof UomFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const UomMutationDto = z.object({ ...UomDto.pick({ code: true }).shape })

export type UomMutationDto = z.infer<typeof UomMutationDto>
