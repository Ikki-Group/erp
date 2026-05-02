import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	paginate,
	searchFilter,
	stampCreate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'
import { logger } from '@/core/logger'

import { auditLogsTable } from '@/db/schema'

import * as dto from './audit-log.dto'

const AUDIT_LOG_CACHE_NAMESPACE = 'audit-log'

export class AuditLogRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(AUDIT_LOG_CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */
	#clearCache(id?: number): Promise<void> {
		return record('AuditLogRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await this.cache.deleteMany({ keys })
		})
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'AuditLogRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: dto.AuditLogFilterDto,
	): Promise<WithPaginationResult<dto.AuditLogDto>> {
		return record('AuditLogRepo.getListPaginated', async () => {
			const { q, page, limit, action, entityType, userId, fromDate, toDate } = filter
			const where = and(
				q === undefined ? undefined : searchFilter(auditLogsTable.description, q),
				action === undefined
					? undefined
					: action
						? eq(
								auditLogsTable.action,
								action as any as 'CREATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'OTHER' | 'UPDATE',
							)
						: eq(auditLogsTable.entityType, entityType),
				userId === undefined ? undefined : eq(auditLogsTable.userId, userId),
				fromDate === undefined ? undefined : gte(auditLogsTable.actionAt, fromDate),
				toDate === undefined ? undefined : lte(auditLogsTable.actionAt, toDate),
			)

			return paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(auditLogsTable)
						.where(where)
						.orderBy(desc(auditLogsTable.actionAt))
						.limit(limit)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(auditLogsTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<dto.AuditLogDto | undefined> {
		return record('AuditLogRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await this.db
						.select()
						.from(auditLogsTable)
						.where(eq(auditLogsTable.id, id))
						.limit(1)
						.then(takeFirst)

					return res ?? skip()
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.AuditLogCreateDto, actorId: number): Promise<number | undefined> {
		return record('AuditLogRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(auditLogsTable)
				.values({ ...data, ...metadata })
				.returning({ id: auditLogsTable.id })

			this.#clearCacheAsync()
			return res?.id
		})
	}
}
