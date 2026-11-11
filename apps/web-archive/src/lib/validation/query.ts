import { z } from 'zod'

const id = z.coerce.number().int().positive()
const ids = z
	.array(id)
	.or(id)
	.transform((val) => (Array.isArray(val) ? val : [val]))

const search = z
	.string()
	.trim()
	.optional()
	.transform((val) => (val?.length === 0 ? undefined : val))

// Query booleans arrive as strings ("true"/"1"). Match the server's parsing
// so 'false' → false (z.coerce.boolean would make any non-empty string true).
const boolean = z
	.string()
	.optional()
	.transform((val) => val === 'true' || val === '1')

const recordId = z.object({ id: id })

const pagination = z.object({
	page: z.coerce.number().int().positive().default(1).catch(1),
	limit: z.coerce.number().int().positive().max(100).default(10).catch(10),
})

function withPagination<T extends z.ZodRawShape>(shape: T) {
	return z.object({
		...shape,
		...pagination.shape,
	})
}

export const zq = {
	id,
	ids,
	search,
	boolean,
	recordId,
	pagination,
	withPagination,
}
