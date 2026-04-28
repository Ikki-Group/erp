import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, isNull, or } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'
import { logger } from '@/core/logger'

import { employeesTable } from '@/db/schema/employee'

import type {
	EmployeeCreateDto,
	EmployeeDto,
	EmployeeFilterDto,
	EmployeeUpdateDto,
} from './employee.dto'

const EMPLOYEE_CACHE_NAMESPACE = 'employee'

export class EmployeeRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(EMPLOYEE_CACHE_NAMESPACE)
	}
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await this.cache.deleteMany({ keys })
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'EmployeeRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(filter: EmployeeFilterDto): Promise<WithPaginationResult<EmployeeDto>> {
		return record('EmployeeRepo.getListPaginated', async () => {
			const { q, page, limit } = filter

			const searchCondition = q
				? or(ilike(employeesTable.name, `%${q}%`), ilike(employeesTable.code, `%${q}%`))
				: undefined

			const where = and(isNull(employeesTable.deletedAt), searchCondition)

			return paginate<EmployeeDto>({
				data: ({ limit: l, offset }) =>
					this.db
						.select()
						.from(employeesTable)
						.where(where)
						.orderBy(sortBy(employeesTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(employeesTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<EmployeeDto | undefined> {
		return record('EmployeeRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await this.db
						.select()
						.from(employeesTable)
						.where(and(eq(employeesTable.id, id), isNull(employeesTable.deletedAt)))
						.limit(1)
						.then(takeFirst)

					return res ?? skip()
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: EmployeeCreateDto, actorId: number): Promise<number | undefined> {
		return record('EmployeeRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(employeesTable)
				.values({ ...data, ...metadata })
				.returning({ id: employeesTable.id })

			this.#clearCacheAsync()
			return res?.id
		})
	}

	async update(data: EmployeeUpdateDto, actorId: number): Promise<number | undefined> {
		return record('EmployeeRepo.update', async () => {
			const { id, ...rest } = data
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(employeesTable)
				.set({ ...rest, ...metadata })
				.where(eq(employeesTable.id, id))
				.returning({ id: employeesTable.id })

			this.#clearCacheAsync(res?.id)
			return res?.id
		})
	}

	async remove(id: number, actorId: number): Promise<number | undefined> {
		return record('EmployeeRepo.remove', async () => {
			const [res] = await this.db
				.update(employeesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(employeesTable.id, id))
				.returning({ id: employeesTable.id })

			this.#clearCacheAsync(id)
			return res?.id
		})
	}
}
