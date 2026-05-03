import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, isNull, or } from 'drizzle-orm'

import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { employeesTable } from '@/db/schema/employee'

import type {
	EmployeeCreateDto,
	EmployeeDto,
	EmployeeFilterDto,
	EmployeeUpdateDto,
} from './employee.dto'

export class EmployeeRepo {
	constructor(private readonly db: DbClient) {}

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
			return this.db
				.select()
				.from(employeesTable)
				.where(and(eq(employeesTable.id, id), isNull(employeesTable.deletedAt)))
				.limit(1)
				.then(takeFirst)
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

			return res?.id
		})
	}
}
