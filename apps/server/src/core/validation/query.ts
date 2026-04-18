import z from 'zod'

import { zp } from './primitive'

const id = zp.id
const ids = z
	.array(id)
	.or(id)
	.transform((val) => (Array.isArray(val) ? val : [val]))

const boolean = z.stringbool().optional()

const pagination = z.object({
	page: z.number().int().positive().default(1).catch(1),
	limit: z.number().int().positive().max(100).default(10).catch(10),
})

export const zq = {
	id,
	ids,
	boolean,
	pagination,
}
