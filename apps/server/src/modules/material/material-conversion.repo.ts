import { and, count, eq } from 'drizzle-orm'

import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
} from '@/core/database'
import type { WithPaginationResult } from '@/core/database/pagination'

import { materialConversionsTable } from '@/db/schema'

import type {
	MaterialConversionFilterSchema,
	MaterialConversionSchema,
	MaterialConversionCreateSchema,
	MaterialConversionUpdateSchema,
} from './material-conversion.schema'

export class MaterialConversionRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<MaterialConversionSchema | undefined> {
		return this.db
			.select()
			.from(materialConversionsTable)
			.where(eq(materialConversionsTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async getByMaterialId(materialId: number): Promise<MaterialConversionSchema[]> {
		return this.db
			.select()
			.from(materialConversionsTable)
			.where(eq(materialConversionsTable.materialId, materialId))
	}

	async getListPaginated(
		filter: MaterialConversionFilterSchema,
	): Promise<WithPaginationResult<MaterialConversionSchema>> {
		const { materialId, uomId, page, limit } = filter
		const where = and(
			materialId ? eq(materialConversionsTable.materialId, materialId) : undefined,
			uomId ? eq(materialConversionsTable.uomId, uomId) : undefined,
		)

		return paginate<MaterialConversionSchema>({
			data: ({ limit: l, offset }) =>
				this.db
					.select()
					.from(materialConversionsTable)
					.where(where)
					.orderBy(sortBy(materialConversionsTable.updatedAt, 'desc'))
					.limit(l)
					.offset(offset),
			pq: { page, limit },
			countQuery: this.db.select({ count: count() }).from(materialConversionsTable).where(where),
		})
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(materialConversionsTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: MaterialConversionCreateSchema, actorId: number): Promise<number | undefined> {
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(materialConversionsTable)
			.values({ ...data, ...metadata })
			.returning({ id: materialConversionsTable.id })

		return res?.id
	}

	async update(
		id: number,
		data: MaterialConversionUpdateSchema,
		actorId: number,
	): Promise<number | undefined> {
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(materialConversionsTable)
			.set({ ...data, ...metadata })
			.where(eq(materialConversionsTable.id, id))
			.returning({ id: materialConversionsTable.id })

		return res?.id
	}

	async remove(id: number): Promise<number | undefined> {
		const [res] = await this.db
			.delete(materialConversionsTable)
			.where(eq(materialConversionsTable.id, id))
			.returning({ id: materialConversionsTable.id })

		return res?.id
	}
}
