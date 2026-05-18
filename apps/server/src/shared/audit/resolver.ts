// import { eq } from 'drizzle-orm'

// import { usersTable } from '@/db/schema'

// import type { DbClient } from '@/infra/database'

// export interface UserSnippet {
// 	id: number
// 	username: string
// 	fullname: string
// }

// export interface AuditResolved {
// 	creator: UserSnippet | null
// 	updater: UserSnippet | null
// }

// export interface WithAudit {
// 	createdBy: number
// 	updatedBy: number
// 	[key: string]: any
// }

// export class AuditResolver {
// 	private readonly cache: CacheService

// 	constructor(
// 		private readonly db: DbClient,
// 		cacheClient: CacheClient,
// 	) {
// 		this.cache = new CacheService({ ns: 'system.audit', client: cacheClient, keys: {} })
// 	}

// 	/**
// 	 * Internal private helper to fetch a User Snippet via cache + db
// 	 */
// 	private async fetchAuditUser(id: number | null | undefined): Promise<UserSnippet | undefined> {
// 		if (!id) return undefined

// 		return this.cache.getOrSet({
// 			key: `user.${id}`,
// 			factory: async () => {
// 				const [user] = await this.db
// 					.select({
// 						id: usersTable.id,
// 						username: usersTable.username,
// 						fullname: usersTable.fullname,
// 					})
// 					.from(usersTable)
// 					.where(eq(usersTable.id, id))
// 					.limit(1)

// 				return user as UserSnippet | undefined
// 			},
// 		})
// 	}

// 	/**
// 	 * Resolves audit fields for a single object.
// 	 */
// 	async resolve<T extends WithAudit>(data: T): Promise<T & AuditResolved> {
// 		const [creator, updater] = await Promise.all([
// 			this.fetchAuditUser(data.createdBy),
// 			data.updatedBy === data.createdBy ? undefined : this.fetchAuditUser(data.updatedBy),
// 		])

// 		if (!creator) throw new Error('Audit Resolver: creator not found')

// 		return {
// 			...data,
// 			creator,
// 			updater: data.updatedBy === data.createdBy ? creator : updater!,
// 		}
// 	}

// 	/**
// 	 * Resolves audit fields for an array of objects.
// 	 */
// 	async resolveList<T extends WithAudit>(dataList: T[]): Promise<(T & AuditResolved)[]> {
// 		return Promise.all(dataList.map((data) => this.resolve(data)))
// 	}
// }

// // Backward-compatible singleton exports (to be refactored to DI in later phase)
// import { cacheClient } from '@/core/cache'

// import { db } from '@/db'

// import type { CacheClient, CacheService } from '@/infra/cache'

// const _resolver = new AuditResolver(db, cacheClient)

// export function resolveAudit<T extends WithAudit>(data: T): Promise<T & AuditResolved> {
// 	return _resolver.resolve(data)
// }

// export function resolveAuditList<T extends WithAudit>(
// 	dataList: T[],
// ): Promise<(T & AuditResolved)[]> {
// 	return _resolver.resolveList(dataList)
// }
