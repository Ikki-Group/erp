import { z } from 'zod'

// Base
const str = z.string()

const strNullable = str.nullable()
const strTrim = str.trim()
const strTrimNullable = str.nullable().transform((val) => (val?.length === 0 ? null : val))

const num = z.number()
const numCoerce = z.coerce.number()

const bool = z.boolean()
const boolCoerce = z.coerce.boolean()

const date = z.coerce.date()

// Derived
const id = z.number().int().positive()
const uuid = z.uuidv7()
const email = z.email().transform((v) => v.toLowerCase())

export const zp = {
	// String
	str,
	strNullable,
	strTrim,
	strTrimNullable,
	// Numeric
	num,
	numCoerce,
	// Boolean
	bool,
	boolCoerce,
	// Date
	date,
	// Derived
	id,
	uuid,
	email,
}
