import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const RoleDto = z.object({
  id: zPrimitive.id,
  code: zPrimitive.str,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  isSystem: zPrimitive.bool,
  ...zSchema.metadata.shape,
})

export type RoleDto = z.infer<typeof RoleDto>

/* --------------------------------- COMMON --------------------------------- */

export const RoleFilterDto = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .transform((val) => val || undefined),
})

export type RoleFilterDto = z.infer<typeof RoleFilterDto>

/* --------------------------------- MUTATION --------------------------------- */

export const RoleMutationDto = z.object({
  code: zPrimitive.str,
  name: zPrimitive.str,
  isSystem: zPrimitive.bool,
})

export type RoleMutationDto = z.infer<typeof RoleMutationDto>
