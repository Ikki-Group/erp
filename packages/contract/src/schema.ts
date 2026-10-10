import { z } from 'zod'

export { z }

// ─── Output primitives (zp) — response DTOs, no trimming ───
export const zp = {
	id: z.number().int().positive(),
	str: z.string(),
	bool: z.boolean(),
	num: z.number(),
	/** JSON carries ISO strings; parse back into Date on both ends. */
	date: z.coerce.date(),
	/** Postgres numeric serialized as a string (money, qty). May be negative (stock debt). */
	decimal: z.string().regex(/^-?\d+(\.\d+)?$/u),
} as const

// ─── Input primitives (zc) — create/update bodies, trimmed and validated ───
export const zc = {
	strTrim: z.string().trim().min(1),
	/** Empty form input becomes null. */
	strTrimNullable: z
		.string()
		.trim()
		.transform((value) => (value.length === 0 ? null : value))
		.nullable(),
	strOptional: z.string().trim().optional(),
	email: z.email().max(255).toLowerCase(),
	username: z
		.string()
		.trim()
		.min(3)
		.max(30)
		.regex(/^[a-zA-Z0-9_.-]+$/u, 'Only letters, numbers, dot, dash and underscore'),
	password: z.string().min(8).max(100),
	/** Non-negative money/qty entered as a decimal string, e.g. "12500" or "1.5". */
	decimal: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a non-negative number'),
	/** Like `decimal` but strictly greater than zero. */
	positiveDecimal: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a number')
		.refine((value) => /[1-9]/u.test(value), 'Must be greater than 0'),
	AuditBasic: z.object({
		createdAt: z.coerce.date(),
		updatedAt: z.coerce.date(),
		createdBy: z.number().int().nullable(),
		updatedBy: z.number().int().nullable(),
	}),
	RecordId: z.object({ id: z.number().int().positive() }),
} as const

// ─── Query primitives (zq) — query strings, coerced ───
export const zq = {
	id: z.coerce.number().int().positive(),
	pagination: z.object({
		page: z.coerce.number().int().positive().default(1),
		// ponytail: pickers load whole catalogs (≤500 rows); switch to searchable comboboxes past that.
		limit: z.coerce.number().int().positive().max(500).default(20),
	}),
	/** Blank search is treated as no search. */
	search: z
		.string()
		.trim()
		.optional()
		.transform((value) => (value ? value : undefined)),
	/** "true"/"1" → true; anything else → false (z.coerce.boolean treats "false" as true). */
	boolean: z
		.string()
		.optional()
		.transform((value) => value === 'true' || value === '1'),
	recordId: z.object({ id: z.coerce.number().int().positive() }),
} as const

/** Most mutations return `{ id }`. */
export const EntityRefDto = z.object({ id: zp.id })
export type EntityRefDto = z.infer<typeof EntityRefDto>
