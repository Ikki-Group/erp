import { z } from 'zod'

const str = z.string()
const strNullable = str.nullable()

const num = z.number()

const bool = z.boolean()

const date = z.coerce.date()
const dateNullable = date.nullable()

const id = z.number().int().positive()

const decimal = z
	.union([z.string(), z.number()])
	.transform((val: string | number) => val.toString())

export const zp = {
	str,
	strNullable,
	num,
	bool,
	date,
	dateNullable,
	id,
	decimal,
}
