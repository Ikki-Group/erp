import { z } from 'zod'

import { zc } from './common'

/**
 * Standard success response schema — wraps a payload into
 * `{ success: true, code: string, data: T }`.
 *
 * @example
 * response: createSuccessResponseDto(LocationSchema)
 */
export function createSuccessResponseDto<T extends z.ZodType>(dataDto: T) {
	return z.object({
		success: z.literal(true),
		code: z.string().default('OK'),
		data: dataDto,
	})
}

/**
 * Standard paginated response schema — wraps an array into
 * `{ success: true, code: string, data: T[], meta: PaginationMeta }`.
 *
 * @example
 * response: createPaginatedResponseDto(LocationSchema)
 */
export function createPaginatedResponseDto<T extends z.ZodType>(itemDto: T) {
	return z.object({
		success: z.literal(true),
		code: z.string().default('OK'),
		data: z.array(itemDto),
		meta: zc.PaginationMeta,
	})
}
