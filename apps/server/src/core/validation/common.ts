import { z } from 'zod'

import { zp } from './primitive'

const strTrim = z.string().trim()
const strTrimNullable = strTrim.nullable().transform((val) => (val?.length === 0 ? null : val))

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

const AuditMeta = z.object({
	...Timestamps.shape,
	...Actors.shape,
})

const SoftDelete = z.object({
	deletedBy: zp.id.nullable(),
	deletedAt: zp.date.nullable(),
})

const SyncMeta = z.object({
	syncAt: zp.date.nullable(),
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

const MetadataBase = z.object({
	...AuditMeta.shape,
	...SoftDelete.shape,
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
	//
	RecordId,
	Timestamps,
	Actors,
	AuditMeta,
	AuditResolved,
	SoftDelete,
	SyncMeta,
	UserSnippet,
	MetadataBase,
	PaginationMeta,
}

export type RecordId = z.infer<typeof RecordId>
export type AuditMeta = z.infer<typeof AuditMeta>
export type UserSnippet = z.infer<typeof UserSnippet>
export type AuditResolved = z.infer<typeof AuditResolved>
export type MetadataBase = z.infer<typeof MetadataBase>
export type PaginationMeta = z.infer<typeof PaginationMeta>
