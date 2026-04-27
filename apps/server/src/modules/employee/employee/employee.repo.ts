import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, isNull, or } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type WithPaginationResult,
} from '@/core/database'

import { db } from '@/db'
import { employeesTable } from '@/db/schema/employee'

import type {
	EmployeeCreateDto,
	EmployeeDto,
	EmployeeFilterDto,
	EmployeeUpdateDto,
} from './employee.dto'

const cache = bento.namespace('employee')

export class EmployeeRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	#clearCache(id?: number): Promise<void> {
		return record('EmployeeRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await cache.deleteMany({ keys })
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
					db
						.select()
						.from(employeesTable)
						.where(where)
						.orderBy(sortBy(employeesTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(employeesTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<EmployeeDto | undefined> {
		return record('EmployeeRepo.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await db
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
			const [res] = await db
				.insert(employeesTable)
				.values({ ...data, ...metadata })
				.returning({ id: employeesTable.id })

			void this.#clearCache()
			return res?.id
		})
	}

	async update(data: EmployeeUpdateDto, actorId: number): Promise<number | undefined> {
		return record('EmployeeRepo.update', async () => {
			const { id, ...rest } = data
			const metadata = stampUpdate(actorId)
			const [res] = await db
				.update(employeesTable)
				.set({ ...rest, ...metadata })
				.where(eq(employeesTable.id, id))
				.returning({ id: employeesTable.id })

			void this.#clearCache(res?.id)
			return res?.id
		})
	}

	async remove(id: number, actorId: number): Promise<number | undefined> {
		return record('EmployeeRepo.remove', async () => {
			const [res] = await db
				.update(employeesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(employeesTable.id, id))
				.returning({ id: employeesTable.id })

			void this.#clearCache(id)
			return res?.id
		})
	}
}
