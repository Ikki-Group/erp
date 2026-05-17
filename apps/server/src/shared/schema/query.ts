import { z } from 'zod'

const id = z.coerce.number().int().positive()
const ids = z
	.array(id)
	.or(id)
	.transform((val: number | number[]) => (Array.isArray(val) ? val : [val]))

const search = z
	.string()
	.trim()
	.optional()
	.transform((val: string | undefined) => (val?.length === 0 ? undefined : val))

const boolean = z
	.string()
	.optional()
	.transform((val: string | undefined) => val === 'true' || val === '1')

const recordId = z.object({ id: id })

const pagination = z.object({
	page: z.coerce.number().int().positive().default(1).catch(1),
	limit: z.coerce.number().int().positive().max(100).default(10).catch(10),
})

export const zq = {
	id,
	ids,
	search,
	boolean,
	recordId,
	pagination,
}
