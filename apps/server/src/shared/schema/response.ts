import { z } from 'zod'

import { zc } from './common'

/**
 * Standard Success Response Schema.
 * Wraps any schema into { success: true, code: string, data: T }
 *
 * @example
 * const userDto = z.object({ id: z.number(), name: z.string() })
 * const response = createSuccessResponseDto( T)
 * // { success: true, code: string, data: { id, name } }
 */
export function createSuccessResponseDto<T extends z.ZodType>(dataDto: T) {
	return z.object({
		success: z.literal(true),
		code: z.string().default('OK'),
		data: dataDto,
	})
}

/**
 * Standard List Response Schema.
 * Wraps an array into { success: true, code: string, data: T[], meta: { ... } }
 *
 * @example
 * const itemDto = z.object({ id: z.number(), name: z.string() })
 * const response = createPaginatedResponseDto( T)
 * // { success: true, code: string, data: [{ id, name }], meta: { page, limit, total, totalPages } }
 */
export function createPaginatedResponseDto<T extends z.ZodType>(itemDto: T) {
	return z.object({
		success: z.literal(true),
		code: z.string().default('OK'),
		data: z.array(itemDto),
		meta: zc.PaginationMeta,
	})
}

export const successRecordIdDto = createSuccessResponseDto(zc.RecordId)
export const successNoDataDto = createSuccessResponseDto(z.undefined())
