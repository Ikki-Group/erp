import { z } from 'zod'
import { zp } from './primitive'

const strTrim = z.string().trim()
const strTrimNullable = z
	.string()
	.trim()
	.transform((val) => (val.length === 0 ? null : val))
	.nullable()

const email = z.email().transform((v) => v.toLowerCase())

const RecordId = z.object({ id: zp.id })

const Timestamps = z.object({
	createdAt: zp.date,
	updatedAt: zp.date,
})

const Actors = z.object({
	createdBy: zp.id,
	updatedBy: zp.id,
})

const SoftDelete = z.object({
	deletedBy: zp.id.nullable(),
	deletedAt: zp.date.nullable(),
})

const SyncMeta = z.object({
	syncAt: zp.date.nullable(),
})

/** Timestamp + actor — untuk entity ringan tanpa soft delete */
const AuditBasic = z.object({
	...Timestamps.shape,
	...Actors.shape,
})

/** AuditBasic + soft delete — paling umum dipakai */
const AuditFull = z.object({
	...AuditBasic.shape,
	...SoftDelete.shape,
})

/** AuditFull + syncAt — untuk entity yang disync dari external system */
const AuditSync = z.object({
	...AuditFull.shape,
	...SyncMeta.shape,
})

const UserSnippet = z.object({
	id: zp.id,
	username: zp.str,
	fullname: zp.str,
})

const AuditResolved = z.object({
	creator: UserSnippet.nullable(),
	updater: UserSnippet.nullable(),
})

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
	RecordId,
	Timestamps,
	Actors,
	SoftDelete,
	SyncMeta,
	AuditBasic,
	AuditFull,
	AuditSync,
	AuditResolved,
	UserSnippet,
	PaginationMeta,
} as const

export type RecordId = z.infer<typeof RecordId>
export type AuditBasic = z.infer<typeof AuditBasic>
export type AuditFull = z.infer<typeof AuditFull>
export type AuditSync = z.infer<typeof AuditSync>
export type UserSnippet = z.infer<typeof UserSnippet>
export type AuditResolved = z.infer<typeof AuditResolved>
export type PaginationMeta = z.infer<typeof PaginationMeta>
