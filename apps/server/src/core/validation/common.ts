import { z } from 'zod'

import { zp } from './primitive'

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
	page: z.number().int().positive(),
	limit: z.number().int().positive(),
	total: z.number().int().nonnegative(),
	totalPages: z.number().int().nonnegative(),
})

export const zc = {
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
