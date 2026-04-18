import { z } from 'zod'

export const zStr = z.string().trim()
export const zStrNullable = z
	.string()
	.trim()
	.nullable()
	.transform((val) => (val?.length === 0 ? null : val))

export const zNum = z.number()
export const zNumCoerce = z.coerce.number()
export const zId = z.coerce.number().int().positive()

export const zDate = z.coerce.date()

export const zBool = z.boolean()

export const zEmail = z.email().transform((v) => v.toLowerCase())
export const zPassword = z
	.string()
	.trim()
	.min(8, 'Password must be at least 8 characters')
	.max(100, 'Password must not exceed 100 characters')
export const zUsername = z
	.string()
	.trim()
	.min(3, 'Username must be at least 3 characters')
	.max(50, 'Username must not exceed 50 characters')
	.transform((v) => v.toLowerCase())

export const zUuid = z.uuidv7()
export const zCodeUpper = z.string().trim().toUpperCase()
export const zDecimal = z.string().trim()

export const zSortOrder = z.number().int().nonnegative()

export const zp = {
	// String
	str: zStr,
	strNullable: zStrNullable,

	// Numeric
	num: zNum,
	numCoerce: zNumCoerce,
	id: zId,

	// Temporal
	date: zDate,

	// Boolean
	bool: zBool,

	// Authentication
	email: zEmail,
	password: zPassword,
	username: zUsername,

	// Special
	uuid: zUuid,
	codeUpper: zCodeUpper,
	decimal: zDecimal,
	sortOrder: zSortOrder,
}
