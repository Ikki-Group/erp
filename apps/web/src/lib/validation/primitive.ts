import { z } from 'zod'

const str = z.string()
const strNullable = str.nullable()

const num = z.number()
const numCoerce = z.coerce.number()

const bool = z.boolean()
const boolCoerce = z.coerce.boolean()

const date = z.coerce.date()
const dateNullable = date.nullable()

const id = z.number().int().positive()
const uuid = z.uuid()

// Decimal values arrive as strings over the wire (server numeric → JSON string).
// Keep the inferred type as `string` to match the server contract; components
// convert with Number(...) at the point of use. Lightweight: no coercion.
const decimal = z.string()

export const zp = {
	str,
	strNullable,
	num,
	numCoerce,
	bool,
	boolCoerce,
	date,
	dateNullable,
	id,
	uuid,
	decimal,
}
