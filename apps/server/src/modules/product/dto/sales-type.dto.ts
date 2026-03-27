import z from 'zod'

import { zStr, zBool, zId, zQuerySearch, zMetadataSchema } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const SalesTypeDto = z.object({
  id: zId,
  code: zStr,
  name: zStr,
  isSystem: zBool,
  ...zMetadataSchema.shape,
})

export type SalesTypeDto = z.infer<typeof SalesTypeDto>

/* --------------------------------- FILTER --------------------------------- */

export const SalesTypeFilterDto = z.object({ search: zQuerySearch })

export type SalesTypeFilterDto = z.infer<typeof SalesTypeFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const SalesTypeMutationDto = z.object({ ...SalesTypeDto.pick({ code: true, name: true, isSystem: true }).shape })

export type SalesTypeMutationDto = z.infer<typeof SalesTypeMutationDto>
