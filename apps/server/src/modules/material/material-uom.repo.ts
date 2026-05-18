import { count, eq } from 'drizzle-orm'

import type { WithPaginationResult } from '@/core/database/pagination'

import { uomsTable } from '@/db/schema'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
} from '@/infra/database'

import type { ActorId, EntityRef } from '@/types/utils'

import type {
	MaterialUomFilterSchema,
	MaterialUomMutationSchema,
	MaterialUomSchema,
} from './material-uom.schema'

export class MaterialUomRepo {
	constructor(private readonly db: DbClient) {}

	async getList(): Promise<MaterialUomSchema[]> {
		return this.db.select().from(uomsTable).orderBy(uomsTable.code)
	}

	async getListPaginated(
		filter: MaterialUomFilterSchema,
	): Promise<WithPaginationResult<MaterialUomSchema>> {
		const { q } = filter
		const where = searchFilter(uomsTable.code, q)

		return paginate<MaterialUomSchema>({
			data: ({ limit, offset }) =>
				this.db
					.select()
					.from(uomsTable)
					.where(where)
					.orderBy(sortBy(uomsTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: this.db.select({ count: count() }).from(uomsTable).where(where),
		})
	}

	async getById(id: number): Promise<MaterialUomSchema | undefined> {
		return this.db.select().from(uomsTable).where(eq(uomsTable.id, id)).limit(1).then(takeFirst)
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(uomsTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async create(data: MaterialUomMutationSchema, actorId: ActorId): Promise<EntityRef | undefined> {
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(uomsTable)
			.values({ ...data, ...metadata })
			.returning({ id: uomsTable.id })

		return res
	}

	async update(
		id: number,
		data: MaterialUomMutationSchema,
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(uomsTable)
			.set({ ...data, ...metadata })
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

	async seed(data: Pick<MaterialUomSchema, 'code' | 'createdBy'>[]): Promise<void> {
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
