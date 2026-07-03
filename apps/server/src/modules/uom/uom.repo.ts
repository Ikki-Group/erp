import { and, count, eq } from 'drizzle-orm'

import { uomsTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, takeFirst, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { UomDto, UomFilterDto } from './uom.contract'

export class UomRepo {
	constructor(readonly db: DbContext) {}

	async getList(): Promise<UomDto[]> {
		return this.db.select().from(uomsTable).orderBy(uomsTable.code)
	}

	async getListPaginated(filter: UomFilterDto): Promise<WithPaginationResult<UomDto>> {
		const { q, page, limit } = filter
		const where = and(searchFilter(uomsTable.code, q))

		return paginate<UomDto>({
			data: ({ limit: l, offset }) =>
				this.db
					.select()
					.from(uomsTable)
					.where(where)
					.orderBy(sortBy(uomsTable.updatedAt, 'desc'))
					.limit(l)
					.offset(offset),
			pq: { page, limit },
			countQuery: () => this.db.select({ count: count() }).from(uomsTable).where(where),
		})
	}

	async getById(id: number): Promise<UomDto | undefined> {
		return this.db.select().from(uomsTable).where(eq(uomsTable.id, id)).limit(1).then(takeFirst)
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(uomsTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async create(data: { code: string; createdBy: number }): Promise<EntityRef | undefined> {
		const metadata = stampCreate(data.createdBy)
		const [res] = await this.db
			.insert(uomsTable)
			.values({
				code: data.code,
				name: data.code,
				...metadata,
			})
			.returning({ id: uomsTable.id })

		return res
	}

	async update(
		id: number,
		data: { code: string; updatedBy: number },
	): Promise<EntityRef | undefined> {
		const metadata = stampUpdate(data.updatedBy)
		const [res] = await this.db
			.update(uomsTable)
			.set({
				code: data.code,
				name: data.code,
				...metadata,
			})
			.where(eq(uomsTable.id, id))
			.returning({ id: uomsTable.id })

		return res
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		const [res] = await this.db
			.delete(uomsTable)
			.where(eq(uomsTable.id, id))
			.returning({ id: uomsTable.id })

		return res
	}

	async seed(data: { code: string; createdBy: number }[]): Promise<void> {
		const existing = await this.db.select({ code: uomsTable.code }).from(uomsTable)
		const existingCodes = new Set(existing.map((e) => e.code))

		const newUoms = data
			.map((d) => ({ ...d, code: d.code.toUpperCase().trim(), name: d.code }))
			.filter((d) => !existingCodes.has(d.code))

		if (newUoms.length === 0) return

		await this.db
			.insert(uomsTable)
			.values(newUoms.map((d) => Object.assign({}, d, stampCreate(d.createdBy))))
	}
}
