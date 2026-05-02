/* eslint-disable @typescript-eslint/no-deprecated */
import { eq } from 'drizzle-orm'

import { bento } from '@/core/cache'
import type { AuditResolved, UserSnippet } from '@/core/validation'

import { db } from '@/db'
import { usersTable } from '@/db/schema'

const cache = bento.namespace('system.audit')

/**
 * Audit Resolver Utility
 *
 * Implementing the "Shared Kernel" pattern:
 * Resolves `createdBy` and `updatedBy` ID references directly from the database and cache.
 * We do NOT inject `UserService` to strictly prevent Circular Dependencies between domains.
 */

export interface WithAudit {
	createdBy: number
	updatedBy: number
	[key: string]: any
}

/**
 * Internal private helper to fetch a User Snippet via cache + db
 */
async function fetchAuditUser(id: number | null | undefined): Promise<UserSnippet | undefined> {
	if (!id) return undefined

	return cache.getOrSet({
		key: `user.${id}`,
		factory: async () => {
			const [user] = await db
				.select({
					id: usersTable.id,
					username: usersTable.username,
					fullname: usersTable.fullname,
				})
				.from(usersTable)
				.where(eq(usersTable.id, id))
				.limit(1)

			return user as UserSnippet | undefined
		},
	})
}

/**
 * Resolves audit fields for a single object.
 * Simply pass the DTO/Data object, and it will return a new object with `creator` and `updater`.
 */
export async function resolveAudit<T extends WithAudit>(data: T): Promise<T & AuditResolved> {
	// Concurrent fetch to avoid waterfall
	const [creator, updater] = await Promise.all([
		fetchAuditUser(data.createdBy),
		data.updatedBy === data.createdBy ? undefined : fetchAuditUser(data.updatedBy),
	])

	if (!creator) throw new Error('Audit Resolver: creator not found')

	return {
		...data,
		creator,
		updater: data.updatedBy === data.createdBy ? creator : updater!,
	}
}

/**
 * Resolves audit fields for an array of objects.
 * Safely handles hundreds of rows since `fetchAuditUser` uses `cache.wrap`
 * mapping everything to a few Redis/Memory calls.
 */
export async function resolveAuditList<T extends WithAudit>(
	dataList: T[],
): Promise<(T & AuditResolved)[]> {
	return Promise.all(dataList.map((data) => resolveAudit(data)))
}
