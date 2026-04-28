import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull, or } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	type WithPaginationResult,
	type DbClient,
} from '@/core/database'
import { logger } from '@/core/logger'

import { goodsReceiptNoteItemsTable, goodsReceiptNotesTable } from '@/db/schema'

import {
	GoodsReceiptNoteCreateDto,
	GoodsReceiptNoteDto,
	GoodsReceiptNoteFilterDto,
	GoodsReceiptNoteSelectDto,
	type GoodsReceiptStatus,
} from './goods-receipt.dto'

const GOODS_RECEIPT_CACHE_NAMESPACE = 'purchasing.receipt'

export class GoodsReceiptRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(GOODS_RECEIPT_CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await this.cache.deleteMany({ keys })
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'GoodsReceiptRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<GoodsReceiptNoteDto | undefined> {
		return record('GoodsReceiptRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const [grn] = await this.db
						.select()
						.from(goodsReceiptNotesTable)
						.where(and(eq(goodsReceiptNotesTable.id, id), isNull(goodsReceiptNotesTable.deletedAt)))

					if (!grn) return skip()

					const items = await this.db
						.select()
						.from(goodsReceiptNoteItemsTable)
						.where(
							and(
								eq(goodsReceiptNoteItemsTable.grnId, id),
								isNull(goodsReceiptNoteItemsTable.deletedAt),
							),
						)

					return GoodsReceiptNoteDto.parse({ ...grn, items })
				},
			})
		})
	}

	async getListPaginated(
		filter: GoodsReceiptNoteFilterDto,
	): Promise<WithPaginationResult<GoodsReceiptNoteSelectDto>> {
		return record('GoodsReceiptRepo.getListPaginated', async () => {
			const { q, page, limit, status, orderId, locationId, supplierId } = filter
			const where = and(
				isNull(goodsReceiptNotesTable.deletedAt),
				q === undefined
					? undefined
					: or(
							searchFilter(goodsReceiptNotesTable.referenceNumber, q),
							searchFilter(goodsReceiptNotesTable.notes, q),
						),
				status === undefined ? undefined : eq(goodsReceiptNotesTable.status, status),
				orderId === undefined ? undefined : eq(goodsReceiptNotesTable.orderId, orderId),
				locationId === undefined ? undefined : eq(goodsReceiptNotesTable.locationId, locationId),
				supplierId === undefined ? undefined : eq(goodsReceiptNotesTable.supplierId, supplierId),
			)

			return paginate({
				data: async ({ limit: l, offset }) => {
					const rows = await this.db
						.select()
						.from(goodsReceiptNotesTable)
						.where(where)
						.orderBy(sortBy(goodsReceiptNotesTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows.map((r) => GoodsReceiptNoteSelectDto.parse(r))
				},
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(goodsReceiptNotesTable).where(where),
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: GoodsReceiptNoteCreateDto, actorId: number): Promise<{ id: number }> {
		return record('GoodsReceiptRepo.create', async () => {
			const result = await this.db.transaction(async (tx) => {
				const { items, ...headerData } = data
				const meta = stampCreate(actorId)

				const [insertedGrn] = await tx
					.insert(goodsReceiptNotesTable)
					.values({ ...headerData, ...meta })
					.returning({ id: goodsReceiptNotesTable.id })

				if (!insertedGrn) throw new Error('Create GRN header failed')

				const itemValues = items.map((item) => ({
					grnId: insertedGrn.id,
					purchaseOrderItemId: item.purchaseOrderItemId,
					materialId: item.materialId,
					itemName: item.itemName,
					quantityReceived: item.quantityReceived?.toString(),
					notes: item.notes,
					...meta,
				}))

				if (itemValues.length > 0) {
					await tx.insert(goodsReceiptNoteItemsTable).values(itemValues)
				}

				return insertedGrn
			})
			this.#clearCacheAsync()
			return result
		})
	}

	async updateStatus(
		id: number,
		status: GoodsReceiptStatus,
		actorId: number,
	): Promise<{ id: number }> {
		return record('GoodsReceiptRepo.updateStatus', async () => {
			await this.db
				.update(goodsReceiptNotesTable)
				.set({ status, ...stampUpdate(actorId) })
				.where(eq(goodsReceiptNotesTable.id, id))
			this.#clearCacheAsync(id)
			return { id }
		})
	}

	async softDelete(id: number, actorId: number): Promise<{ id: number }> {
		return record('GoodsReceiptRepo.softDelete', async () => {
			const [result] = await this.db
				.update(goodsReceiptNotesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(goodsReceiptNotesTable.id, id))
				.returning({ id: goodsReceiptNotesTable.id })
			if (!result) throw new Error('GRN not found')
			this.#clearCacheAsync(id)
			return result
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('GoodsReceiptRepo.hardDelete', async () => {
			const [result] = await this.db
				.delete(goodsReceiptNotesTable)
				.where(eq(goodsReceiptNotesTable.id, id))
				.returning({ id: goodsReceiptNotesTable.id })
			if (!result) throw new Error('GRN not found')
			this.#clearCacheAsync(id)
			return result
		})
	}
}
