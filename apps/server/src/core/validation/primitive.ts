import { z } from 'zod'

export const zStr = z.string().trim()
export const zStrNullable = z
	.string()
	.trim()
	.transform((val) => (val === '' ? null : val))
	.nullable()
export const zNum = z.number()
export const zNumCoerce = z.coerce.number()
export const zDate = z.coerce.date()
export const zBool = z.boolean()
export const zEmail = z.email().transform((v) => v.toLowerCase())
export const zUuid = z.uuidv7()

export const zId = z.coerce.number().int().positive()

export const zCodeUpper = z.string().trim().toUpperCase()
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

/** Decimal string — for monetary amounts, prices, quantities stored as string (e.g. Decimal DB columns). */
export const zDecimal = z.string().trim()

/** Sort order / display order integer */
/** @deprecated */
export const zSortOrder = z.number().int().nonnegative()

export const zp = {
	str: zStr,
	strNullable: zStrNullable,
	num: zNum,
	numCoerce: zNumCoerce,
	date: zDate,
	bool: zBool,
	email: zEmail,
	uuid: zUuid,
	id: zId,
	codeUpper: zCodeUpper,
	password: zPassword,
	username: zUsername,
	decimal: zDecimal,
}
