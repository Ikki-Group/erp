import { z } from 'zod'

import { zp } from './primitive'

const strTrim = z.string().trim()
const strTrimNullable = z
	.string()
	.trim()
	.transform((val: string) => (val.length === 0 ? null : val))
	.nullable()

const email = z.email().max(255).toLowerCase()

const username = z
	.string()
	.trim()
	.min(3)
	.max(30)
	// oxlint-disable-next-line require-unicode-regexp
	.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

const password = z.string().min(8).max(100)

const fullname = z.string().trim().min(3).max(100)

const RecordId = z.object({ id: zp.id })

/** Audit columns present on every table: `createdAt/updatedAt/createdBy/updatedBy`. */
const AuditBasic = z.object({
	createdAt: zp.date,
	updatedAt: zp.date,
	createdBy: zp.id,
	updatedBy: zp.id,
})

/** `AuditBasic` + soft-delete columns (`deletedAt/deletedBy`). */
const AuditFull = z.object({
	...AuditBasic.shape,
	deletedBy: zp.id.nullable(),
	deletedAt: zp.date.nullable(),
})

/** Standard pagination metadata returned in list responses. */
const PaginationMeta = z.object({
	page: zp.num,
	limit: zp.num,
	total: zp.num,
	totalPages: zp.num,
})

export const zc = {
	strTrim,
	strTrimNullable,
	email,
	username,
	password,
	fullname,
	RecordId,
	AuditBasic,
	AuditFull,
	PaginationMeta,
} as const
