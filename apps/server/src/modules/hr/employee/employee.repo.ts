import { and, count, eq, isNull, or, SQL } from 'drizzle-orm'

import { employeesTable } from '@/db/schema/hr'

import { paginate, searchFilter, sortBy, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { EmployeeDto, EmployeeFilterDto } from './employee.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

type EmployeeInsert = typeof employeesTable.$inferInsert
type EmployeeUpdate = PgUpdateSetSource<typeof employeesTable>

/**
 * Repository port for the employee module. Services depend on this interface
 * (not the concrete class) so they can be unit-tested with plain in-memory
 * fakes and no database. Not-found reads return `undefined`; writes return the
 * affected `EntityRef` or `undefined`. Repos never throw for "not found" — the
 * service decides error semantics. Every write accepts an optional `db`
 * override so it can participate in a caller's transaction.
 */
export interface IEmployeeRepo {
	readonly db: DbContext
	findMany(filter?: EmployeeFilterDto, db?: DbContext): Promise<EmployeeDto[]>
	findPage(filter: EmployeeFilterDto, db?: DbContext): Promise<WithPaginationResult<EmployeeDto>>
	findById(id: number, db?: DbContext): Promise<EmployeeDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<EmployeeDto[]>
	insert(data: EmployeeInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: EmployeeUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class EmployeeRepo implements IEmployeeRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter?: Partial<Pick<EmployeeFilterDto, 'q'>>): SQL | undefined {
		const { q } = filter ?? {}
		return and(
			q === undefined
				? undefined
				: or(searchFilter(employeesTable.name, q), searchFilter(employeesTable.code, q)),
		)
	}

	async findMany(
		filter: Partial<Pick<EmployeeFilterDto, 'q'>> = {},
		db: DbContext = this.db,
	): Promise<EmployeeDto[]> {
		const where = this.#buildWhere(filter)
		return db.select().from(employeesTable).where(where)
	}

	async findPage(
		filter: EmployeeFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<EmployeeDto>> {
		const where = this.#buildWhere(filter)

		return paginate<EmployeeDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(employeesTable)
					.where(and(isNull(employeesTable.deletedAt), where))
					.orderBy(sortBy(employeesTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () =>
				db
					.select({ count: count() })
					.from(employeesTable)
					.where(and(isNull(employeesTable.deletedAt), where)),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<EmployeeDto | undefined> {
		return db
			.select()
			.from(employeesTable)
			.where(and(eq(employeesTable.id, id), isNull(employeesTable.deletedAt)))
			.limit(1)
			.then(takeFirst)
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<EmployeeDto[]> {
		if (ids.length === 0) return []
		const { inArray } = await import('drizzle-orm')
		return db
			.select()
			.from(employeesTable)
			.where(and(inArray(employeesTable.id, ids), isNull(employeesTable.deletedAt)))
	}

	async insert(data: EmployeeInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db.insert(employeesTable).values({ ...data }).returning({ id: employeesTable.id })
		return res
	}

	async update(
		id: number,
		data: EmployeeUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(employeesTable)
			.set({ ...data })
			.where(eq(employeesTable.id, id))
			.returning({ id: employeesTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(employeesTable)
			.where(eq(employeesTable.id, id))
			.returning({ id: employeesTable.id })
		return res
	}
}
