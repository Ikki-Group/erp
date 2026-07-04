import { and, count, desc, eq, isNull, or, type SQL } from 'drizzle-orm'

import { expendituresTable } from '@/db/schema/finance'

import { paginate, searchFilter, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { ExpenditureDto, ExpenditureFilterDto } from './expenditure.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

type ExpenditureInsert = typeof expendituresTable.$inferInsert
type ExpenditureUpdate = PgUpdateSetSource<typeof expendituresTable>

export interface IExpenditureRepo {
	readonly db: DbContext
	findMany(filter?: Partial<ExpenditureFilterDto>, db?: DbContext): Promise<ExpenditureDto[]>
	findPage(filter: ExpenditureFilterDto, db?: DbContext): Promise<WithPaginationResult<ExpenditureDto>>
	findById(id: number, db?: DbContext): Promise<ExpenditureDto | undefined>
	insert(data: ExpenditureInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: ExpenditureUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class ExpenditureRepo implements IExpenditureRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter?: Partial<Pick<ExpenditureFilterDto, 'q' | 'type' | 'status' | 'locationId'>>): SQL | undefined {
		if (!filter) return isNull(expendituresTable.deletedAt)
		const { q, type, status, locationId } = filter
		return and(
			isNull(expendituresTable.deletedAt),
			q
				? or(
						searchFilter(expendituresTable.title, q),
						searchFilter(expendituresTable.description, q),
					)
				: undefined,
			type ? eq(expendituresTable.type, type) : undefined,
			status ? eq(expendituresTable.status, status) : undefined,
			locationId ? eq(expendituresTable.locationId, locationId) : undefined,
		)
	}

	async findMany(
		filter?: Partial<ExpenditureFilterDto>,
		db: DbContext = this.db,
	): Promise<ExpenditureDto[]> {
		const where = this.#buildWhere(filter)
		return db.select().from(expendituresTable).where(where)
	}

	async findPage(
		filter: ExpenditureFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<ExpenditureDto>> {
		const where = this.#buildWhere(filter)

		return paginate<ExpenditureDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(expendituresTable)
					.where(where)
					.orderBy(desc(expendituresTable.date))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(expendituresTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<ExpenditureDto | undefined> {
		return db
			.select()
			.from(expendituresTable)
			.where(and(eq(expendituresTable.id, id), isNull(expendituresTable.deletedAt)))
			.limit(1)
			.then(takeFirst)
	}

	async insert(data: ExpenditureInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(expendituresTable)
			.values({ ...data })
			.returning({ id: expendituresTable.id })
		return res
	}

	async update(
		id: number,
		data: ExpenditureUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(expendituresTable)
			.set({ ...data })
			.where(and(eq(expendituresTable.id, id), isNull(expendituresTable.deletedAt)))
			.returning({ id: expendituresTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(expendituresTable)
			.set({ deletedAt: new Date() })
			.where(and(eq(expendituresTable.id, id), isNull(expendituresTable.deletedAt)))
			.returning({ id: expendituresTable.id })
		return res
	}
}
