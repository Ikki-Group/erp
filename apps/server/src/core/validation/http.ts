import z from 'zod'

import { zId, zNumCoerce, zStr } from './primitive'

/** Coerces a query-string value to a positive integer ID */
export const zQueryId = zId

/** Coerces single or multiple query parameters into an array of IDs. Returns undefined if input is undefined. */
export const zQueryIds = z.preprocess(
	(val) => (val === undefined ? undefined : Array.isArray(val) ? val : [val]),
	z.array(zId).optional(),
)

/** Converts string 'true'/'false' to boolean */
export const zQueryBoolean = z.stringbool().optional()

/** Optional search string, returns undefined for empty strings */
export const zQuerySearch = zStr.optional().transform((val) => (val === '' ? undefined : val))

export const zQueryNum = zNumCoerce

export const zPaginationDto = z.object({
	page: zNumCoerce.positive().default(1).catch(1),
	limit: zNumCoerce.positive().max(100).default(10),
})
