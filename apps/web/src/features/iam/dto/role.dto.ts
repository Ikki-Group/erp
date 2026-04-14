import { z } from 'zod'

import { zBool, zMetadataDto, zPaginationDto, zRecordIdDto, zStr, zStrNullable } from '@/lib/zod'

/**
 * Common Role attributes.
 */
export const RoleBaseDto = z.object({
	code: zStr,
	name: zStr,
	description: zStrNullable,
	permissions: z.string().array(),
	isSystem: zBool,
})
export type RoleBaseDto = z.infer<typeof RoleBaseDto>

/**
 * Role database record.
 */
export const RoleDto = z.object({
	...zRecordIdDto.shape,
	...RoleBaseDto.shape,
	...zMetadataDto.shape,
})
export type RoleDto = z.infer<typeof RoleDto>

/**
 * Input for creating a new Role.
 */
export const RoleCreateDto = RoleBaseDto
export type RoleCreateDto = z.infer<typeof RoleCreateDto>

/**
 * Input for updating an existing Role (Full Update).
 */
export const RoleUpdateDto = z.object({ ...zRecordIdDto.shape, ...RoleBaseDto.shape })
export type RoleUpdateDto = z.infer<typeof RoleUpdateDto>

/**
 * Filter criteria for listing Roles.
 */
export const RoleFilterDto = z.object({ ...zPaginationDto.shape, q: z.string().optional() })
export type RoleFilterDto = z.infer<typeof RoleFilterDto>
