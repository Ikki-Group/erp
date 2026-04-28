import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const UomDto = z.object({ ...zc.RecordId.shape, code: zp.str, ...zc.AuditFull.shape })

export type UomDto = z.infer<typeof UomDto>

/* --------------------------------- FILTER --------------------------------- */

export const UomFilterDto = z.object({ q: zq.search })

export type UomFilterDto = z.infer<typeof UomFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const UomMutationDto = UomDto.pick({ code: true })

export type UomMutationDto = z.infer<typeof UomMutationDto>
export const UomUpdateDto = z.object({ ...zc.RecordId.shape, ...UomMutationDto.shape })

export type UomUpdateDto = z.infer<typeof UomUpdateDto>
