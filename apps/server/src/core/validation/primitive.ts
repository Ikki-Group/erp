import { z } from 'zod'

const str = z.string()
const strNullable = str.nullable()

const num = z.number()
const numCoerce = z.coerce.number()

const bool = z.boolean()
const boolCoerce = z.coerce.boolean()

const date = z.coerce.date()

const id = z.number().int().positive()
const uuid = z.uuidv7()

const decimal = z.coerce.number()

export const zp = {
	str,
	strNullable,
	num,
	numCoerce,
	bool,
	boolCoerce,
	date,
	id,
	uuid,
	decimal,
}
