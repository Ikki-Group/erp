/* eslint-disable @typescript-eslint/no-deprecated */
import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { uomsTable } from '@/db/schema'

import type { UomDto, UomFilterDto } from './uom.dto'

export class UomRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<UomDto[]> {
		return record('UomRepo.getList', async () => {
			return this.db
				.select()
				.from(uomsTable)
				.where(isNull(uomsTable.deletedAt))
				.orderBy(uomsTable.code)
		})
	}

	async getListPaginated(filter: UomFilterDto): Promise<WithPaginationResult<UomDto>> {
		return record('UomRepo.getListPaginated', async () => {
			const { q, page, limit } = filter
			const where = and(isNull(uomsTable.deletedAt), searchFilter(uomsTable.code, q))

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
				countQuery: this.db.select({ count: count() }).from(uomsTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<UomDto | undefined> {
		return record('UomRepo.getById', async () => {
			return this.db
				.select()
				.from(uomsTable)
				.where(and(eq(uomsTable.id, id), isNull(uomsTable.deletedAt)))
				.then(takeFirst)
		})
	}

	async count(): Promise<number> {
		return record('UomRepo.count', async () => {
			return this.db
				.select({ count: count() })
				.from(uomsTable)
				.where(isNull(uomsTable.deletedAt))
				.then((rows) => rows[0]?.count ?? 0)
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: { code: string } & { createdBy: number }): Promise<number | undefined> {
		return record('UomRepo.create', async () => {
			const metadata = stampCreate(data.createdBy)
			const [res] = await this.db
				.insert(uomsTable)
				.values({ ...data, ...metadata })
				.returning({ id: uomsTable.id })

			return res?.id
		})
	}

	async update(
		id: number,
		data: { code: string } & { updatedBy: number },
	): Promise<number | undefined> {
		return record('UomRepo.update', async () => {
			const metadata = stampUpdate(data.updatedBy)
			const [res] = await this.db
				.update(uomsTable)
				.set({ ...data, ...metadata })
				.where(eq(uomsTable.id, id))
				.returning({ id: uomsTable.id })

			return res?.id
		})
	}

	async remove(id: number, actorId: number): Promise<number | undefined> {
		return record('UomRepo.remove', async () => {
			const [res] = await this.db
				.update(uomsTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(uomsTable.id, id))
				.returning({ id: uomsTable.id })

			return res?.id
		})
	}

	async hardRemove(id: number): Promise<number | undefined> {
		return record('UomRepo.hardRemove', async () => {
			const [res] = await this.db
				.delete(uomsTable)
				.where(eq(uomsTable.id, id))
				.returning({ id: uomsTable.id })

			return res?.id
		})
	}

	async seed(data: { code: string; createdBy: number }[]): Promise<void> {
		return record('UomRepo.seed', async () => {
			const existing = await this.db
				.select({ code: uomsTable.code })
				.from(uomsTable)
				.where(isNull(uomsTable.deletedAt))
			const existingCodes = new Set(existing.map((e) => e.code))

			const newUoms = data
				.map((d) => ({ ...d, code: d.code.toUpperCase().trim() }))
				.filter((d) => !existingCodes.has(d.code))

			if (newUoms.length === 0) return

			await this.db
				.insert(uomsTable)
				.values(newUoms.map((d) => Object.assign({}, d, stampCreate(d.createdBy))))
		})
	}
}
