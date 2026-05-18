import { and, count, eq } from 'drizzle-orm'

import { uomsTable } from '@/db/schema'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/infra/database'

import type { IUomRepo, UomFilter } from '../domain/ports'
import type { Uom } from '../domain/uom.entity'

export class UomRepo implements IUomRepo {
	constructor(private readonly db: DbClient) {}

	async getList(): Promise<Uom[]> {
		return this.db.select().from(uomsTable).orderBy(uomsTable.code)
	}

	async getListPaginated(filter: UomFilter): Promise<WithPaginationResult<Uom>> {
		const { q, page, limit } = filter
		const where = and(searchFilter(uomsTable.code, q))

		return paginate<Uom>({
			data: ({ limit: l, offset }) =>
				this.db
					.select()
					.from(uomsTable)
					.where(where)
					.orderBy(sortBy(uomsTable.updatedAt, 'desc'))
					.limit(l)
					.offset(offset),
			pq: { page, limit },
			countQuery: this.db.select({ count: count() }).from(uomsTable).where(where),
		})
	}

	async getById(id: number): Promise<Uom | undefined> {
		return this.db.select().from(uomsTable).where(eq(uomsTable.id, id)).limit(1).then(takeFirst)
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(uomsTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async create(data: { code: string; createdBy: number }): Promise<number | undefined> {
		const metadata = stampCreate(data.createdBy)
		const [res] = await this.db
			.insert(uomsTable)
			.values({ ...data, ...metadata })
			.returning({ id: uomsTable.id })

		return res?.id
	}

	async update(id: number, data: { code: string; updatedBy: number }): Promise<number | undefined> {
		const metadata = stampUpdate(data.updatedBy)
		const [res] = await this.db
			.update(uomsTable)
			.set({ ...data, ...metadata })
			.where(eq(uomsTable.id, id))
			.returning({ id: uomsTable.id })

		return res?.id
	}

	async remove(id: number): Promise<number | undefined> {
		const [res] = await this.db
			.delete(uomsTable)
			.where(eq(uomsTable.id, id))
			.returning({ id: uomsTable.id })

		return res?.id
	}

	async seed(data: { code: string; createdBy: number }[]): Promise<void> {
		const existing = await this.db.select({ code: uomsTable.code }).from(uomsTable)
		const existingCodes = new Set(existing.map((e) => e.code))

		const newUoms = data
			.map((d) => ({ ...d, code: d.code.toUpperCase().trim() }))
			.filter((d) => !existingCodes.has(d.code))

		if (newUoms.length === 0) return

		await this.db
			.insert(uomsTable)
			.values(newUoms.map((d) => Object.assign({}, d, stampCreate(d.createdBy))))
	}
}
