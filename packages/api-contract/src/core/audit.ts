/**
 * Audit trail types for tracking creation and updates
 * @module api-contract/core/audit
 */

export interface Timestamps {
	createdAt: Date
	updatedAt: Date
}

export interface Actors {
	createdBy: number
	updatedBy: number
}

export interface SoftDelete {
	deletedBy: number | null
	deletedAt: Date | null
}

export interface SyncMeta {
	syncAt: Date | null
}

/** Timestamp + actor — untuk entity ringan tanpa soft delete */
export interface AuditBasic extends Timestamps, Actors {}

/** AuditBasic + soft delete — paling umum dipakai */
export interface AuditFull extends AuditBasic, SoftDelete {}

/** AuditFull + syncAt — untuk entity yang disync dari external system */
export interface AuditSync extends AuditFull, SyncMeta {}

export interface UserSnippet {
	id: number
	username: string
	fullname: string
}

export interface AuditResolved {
	creator: UserSnippet | null
	updater: UserSnippet | null
}
