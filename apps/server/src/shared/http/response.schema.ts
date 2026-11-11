import { z } from 'zod'

/**
 * Response envelopes. Each one is registered so the OpenAPI generator renders
 * it in output mode (what the server sends) while request schemas render in
 * input mode (what a client may send: defaulted fields are optional).
 */
const responseSchemas = new WeakSet<z.ZodType>()

export function isResponseSchema(schema: z.ZodType): boolean {
	return responseSchemas.has(schema)
}

function envelope<T extends z.ZodRawShape>(shape: T) {
	const schema = z.object({ success: z.literal(true), ...shape })
	responseSchemas.add(schema)
	return schema
}

/** `{ success, data }`. Usage: `response: zRes.ok(LocationDto)` */
function ok<T extends z.ZodType>(dataSchema: T) {
	return envelope({ data: dataSchema })
}

/** Same shape as `ok`; marks a create endpoint. */
const created = ok

/** Offset-paginated list. */
function paginated<T extends z.ZodType>(itemSchema: T) {
	return envelope({
		data: z.array(itemSchema),
		meta: z.object({
			page: z.number(),
			limit: z.number(),
			total: z.number(),
			totalPages: z.number(),
		}),
	})
}

/** Keyset-paginated list; `nextCursor` is `null` on the last page. */
function cursorPaginated<T extends z.ZodType>(itemSchema: T) {
	return envelope({
		data: z.array(itemSchema),
		meta: z.object({
			nextCursor: z.string().nullable(),
			limit: z.number(),
		}),
	})
}

/** No-data success response. */
const noData = envelope({})

export const zRes = { ok, created, paginated, cursorPaginated, noData }

/** Error envelope produced by the error plugin, for documentation. */
export const ErrorResponseDto = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string().meta({ examples: ['PERMISSION_DENIED'] }),
		message: z.string(),
		path: z.string().optional(),
		context: z.record(z.string(), z.unknown()).optional(),
	}),
})
