import { record } from '@elysiajs/opentelemetry'
import { and, count, eq } from 'drizzle-orm'

import {
	paginate,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type DbTx,
	type WithPaginationResult,
} from '@/core/database'

import { materialConversionsTable } from '@/db/schema'

import * as dto from './material-conversion.dto'

export class MaterialConversionRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: dto.MaterialConversionFilterDto,
	): Promise<WithPaginationResult<dto.MaterialConversionDto>> {
		return record('MaterialConversionRepo.getListPaginated', async () => {
			const { page, limit, materialId, uomId } = filter
			const where = and(
				materialId === undefined ? undefined : eq(materialConversionsTable.materialId, materialId),
				uomId === undefined ? undefined : eq(materialConversionsTable.uomId, uomId),
			)

			return paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(materialConversionsTable)
						.where(where)
						.orderBy(materialConversionsTable.id)
						.limit(limit)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(materialConversionsTable).where(where),
			})
		})
	}

	async getList(materialId?: number): Promise<dto.MaterialConversionDto[]> {
		return record('MaterialConversionRepo.getList', async () => {
			const where =
				materialId === undefined ? undefined : eq(materialConversionsTable.materialId, materialId)
			return this.db.select().from(materialConversionsTable).where(where)
		})
	}

	async getById(id: number): Promise<dto.MaterialConversionDto | undefined> {
		return record('MaterialConversionRepo.getById', async () => {
			return this.db
				.select()
				.from(materialConversionsTable)
				.where(eq(materialConversionsTable.id, id))
				.limit(1)
				.then(takeFirst)
		})
	}

	async getByMaterialAndUom(
		materialId: number,
		uomId: number,
	): Promise<dto.MaterialConversionDto | undefined> {
		return record('MaterialConversionRepo.getByMaterialAndUom', async () => {
			return this.db
				.select()
				.from(materialConversionsTable)
				.where(
					and(
						eq(materialConversionsTable.materialId, materialId),
						eq(materialConversionsTable.uomId, uomId),
					),
				)
				.limit(1)
				.then(takeFirst)
		})
	}

	async count(materialId?: number): Promise<number> {
		return record('MaterialConversionRepo.count', async () => {
			const where =
				materialId === undefined ? undefined : eq(materialConversionsTable.materialId, materialId)
			return this.db
				.select({ count: count() })
				.from(materialConversionsTable)
				.where(where)
				.then((rows) => rows[0]?.count ?? 0)
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(
		data: dto.MaterialConversionCreateDto,
		actorId: number,
	): Promise<number | undefined> {
		return record('MaterialConversionRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(materialConversionsTable)
				.values({
					materialId: data.materialId,
					uomId: data.uomId,
					toBaseFactor: data.toBaseFactor.toString(),
					...metadata,
				})
				.returning({ id: materialConversionsTable.id })

			return res?.id
		})
	}

	async update(
		data: dto.MaterialConversionUpdateDto,
		actorId: number,
	): Promise<number | undefined> {
		return record('MaterialConversionRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(materialConversionsTable)
				.set({
					materialId: data.materialId,
					uomId: data.uomId,
					toBaseFactor: data.toBaseFactor.toString(),
					...metadata,
				})
				.where(eq(materialConversionsTable.id, data.id))
				.returning({ id: materialConversionsTable.id })

			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('MaterialConversionRepo.remove', async () => {
			const [res] = await this.db
				.delete(materialConversionsTable)
				.where(eq(materialConversionsTable.id, id))
				.returning({ id: materialConversionsTable.id })

			return res?.id
		})
	}

	async batchCreate(
		materialId: number,
		conversions: { uomId: number; toBaseFactor: string }[],
		actorId: number,
		tx: DbTx | DbClient = this.db,
	): Promise<void> {
		return record('MaterialConversionRepo.batchCreate', async () => {
			if (conversions.length === 0) return

			const metadata = stampCreate(actorId)
			const uniqueConversions = Array.from(new Map(conversions.map((c) => [c.uomId, c])).values())

			await tx.insert(materialConversionsTable).values(
				uniqueConversions.map((c) => ({
					materialId,
					uomId: c.uomId,
					toBaseFactor: c.toBaseFactor,
					...metadata,
				})),
			)
		})
	}

	async batchReplace(
		materialId: number,
		conversions: { uomId: number; toBaseFactor: string }[],
		actorId: number,
		tx: DbTx | DbClient = this.db,
	): Promise<void> {
		return record('MaterialConversionRepo.batchReplace', async () => {
			const createMetadata = stampCreate(actorId)
			const uniqueConversions = Array.from(new Map(conversions.map((c) => [c.uomId, c])).values())

			await tx
				.delete(materialConversionsTable)
				.where(eq(materialConversionsTable.materialId, materialId))

			if (uniqueConversions.length > 0) {
				await tx.insert(materialConversionsTable).values(
					uniqueConversions.map((c) => ({
						materialId,
						uomId: c.uomId,
						toBaseFactor: c.toBaseFactor,
						...createMetadata,
					})),
				)
			}
		})
	}
}
