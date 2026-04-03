import { z } from 'zod'

import { zBool, zId, zMetadataDto, zPaginationDto, zStr, zStrNullable } from '@/core/validation'

/**
 * Common Role attributes.
 */
export const RoleBase = z.object({
  code: zStr,
  name: zStr,
  description: zStrNullable,
  permissions: z.string().array(),
  isSystem: zBool,
})
export type RoleBase = z.infer<typeof RoleBase>

/**
 * Role database record.
 */
export const Role = z.object({
  ...zId.shape,
  ...RoleBase.shape,
  ...zMetadataDto.shape,
})
export type Role = z.infer<typeof Role>

/**
 * Input for creating a new Role.
 */
export const RoleCreate = RoleBase
export type RoleCreate = z.infer<typeof RoleCreate>

/**
 * Input for updating an existing Role (Full Update).
 */
export const RoleUpdate = z.object({
  ...zId.shape,
  ...RoleBase.shape,
})
export type RoleUpdate = z.infer<typeof RoleUpdate>

/**
 * Filter criteria for listing Roles.
 */
export const RoleFilter = z.object({
  ...zPaginationDto.shape,
  q: z.string().optional(),
})
export type RoleFilter = z.infer<typeof RoleFilter>
