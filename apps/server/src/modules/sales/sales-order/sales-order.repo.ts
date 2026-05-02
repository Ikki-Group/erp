/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import { record } from '@elysiajs/opentelemetry'
import Decimal from 'decimal.js'
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	paginate,
	stampCreate,
	stampUpdate,
	takeFirstOrThrow,
	type WithPaginationResult,
	type DbClient,
} from '@/core/database'
import { BadRequestError, NotFoundError } from '@/core/http/errors'
import { logger } from '@/core/logger'

import {
	salesExternalRefsTable,
	salesOrderBatchesTable,
	salesOrderItemsTable,
	salesOrdersTable,
	salesVoidsTable,
} from '@/db/schema/sales'

import type {
	SalesOrderAddBatchDto,
	SalesOrderBatchDto,
	SalesOrderCreateDto,
	SalesOrderDto,
	SalesOrderFilterDto,
	SalesOrderItemDto,
	SalesOrderOutputDto,
	SalesOrderVoidDto,
	SalesVoidDto,
} from './sales-order.dto'

const SALES_ORDER_CACHE_NAMESPACE = 'sales.order'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Sales Order ${id} not found`, 'SALES_ORDER_NOT_FOUND'),
	itemNotFound: (id: number) =>
		new NotFoundError(`Sales Order Item ${id} not found`, 'SALES_ORDER_ITEM_NOT_FOUND'),
	notOpen: (id: number) =>
		new BadRequestError(`Sales Order ${id} is not open`, 'SALES_ORDER_NOT_OPEN'),
}

export class SalesOrderRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(SALES_ORDER_CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await this.cache.deleteMany({ keys })
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'SalesOrderRepo cache invalidation failed')
		})
	}

	async #recalculateOrderTotals(tx: any = this.db, orderId: number, actorId: number) {
		const allItems = await tx
			.select()
			.from(salesOrderItemsTable)
			.where(eq(salesOrderItemsTable.orderId, orderId))
		const allVoids = await tx
			.select()
			.from(salesVoidsTable)
			.where(eq(salesVoidsTable.orderId, orderId))
		const voidedItemIds = new Set<number>(
			allVoids
				.filter((v: { itemId: number | null }) => v.itemId !== null)
				.map((v: { itemId: number | null }) => v.itemId as number),
		)

		let totalAmount = new Decimal(0)
		let discountAmount = new Decimal(0)
		let taxAmount = new Decimal(0)

		for (const item of allItems) {
			if (!voidedItemIds.has(item.id)) {
				totalAmount = totalAmount.plus(item.subtotal)
				discountAmount = discountAmount.plus(item.discountAmount)
				taxAmount = taxAmount.plus(item.taxAmount)
			}
		}

		const metadata = stampUpdate(actorId)
		await tx
			.update(salesOrdersTable)
			.set({
				totalAmount: totalAmount.toString(),
				discountAmount: discountAmount.toString(),
				taxAmount: taxAmount.toString(),
				gratuityAmount: '0',
				refundAmount: '0',
				...metadata,
			})
			.where(eq(salesOrdersTable.id, orderId))
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<SalesOrderOutputDto | undefined> {
		return record('SalesOrderRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const [row] = await this.db
						.select()
						.from(salesOrdersTable)
						.where(eq(salesOrdersTable.id, id))
					if (!row) return skip()

					const [items, batches, voids] = await Promise.all([
						this.db.select().from(salesOrderItemsTable).where(eq(salesOrderItemsTable.orderId, id)),
						this.db
							.select()
							.from(salesOrderBatchesTable)
							.where(eq(salesOrderBatchesTable.orderId, id)),
						this.db.select().from(salesVoidsTable).where(eq(salesVoidsTable.orderId, id)),
					])

					return {
						...row,
						items: items as unknown as SalesOrderItemDto[],
						batches: batches as unknown as SalesOrderBatchDto[],
						voids: voids as unknown as SalesVoidDto[],
					} as unknown as SalesOrderOutputDto
				},
			})
		})
	}

	async getListPaginated(
		filter: SalesOrderFilterDto,
	): Promise<WithPaginationResult<SalesOrderDto>> {
		return record('SalesOrderRepo.getListPaginated', async () => {
			const { locationId, status, salesTypeId, startDate, endDate, page, limit } = filter

			const dateCondition =
				startDate && endDate
					? and(
							gte(salesOrdersTable.transactionDate, startDate),
							lte(salesOrdersTable.transactionDate, endDate),
						)
					: startDate
						? gte(salesOrdersTable.transactionDate, startDate)
						: endDate
							? lte(salesOrdersTable.transactionDate, endDate)
							: undefined

			const where = and(
				locationId === undefined ? undefined : eq(salesOrdersTable.locationId, locationId),
				status === undefined ? undefined : eq(salesOrdersTable.status, status),
				salesTypeId === undefined ? undefined : eq(salesOrdersTable.salesTypeId, salesTypeId),
				dateCondition,
			)

			const result = await paginate({
				data: ({ limit: l, offset }) =>
					this.db
						.select()
						.from(salesOrdersTable)
						.where(where)
						.orderBy(desc(salesOrdersTable.transactionDate))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(salesOrdersTable).where(where),
			})

			return {
				...result,
				data: result.data as unknown as SalesOrderDto[],
			}
		})
	}

	async checkExistingExternalRef(
		source: string,
		extId: number | string,
	): Promise<number | undefined> {
		const [existingRef] = await this.db
			.select({ orderId: salesExternalRefsTable.orderId })
			.from(salesExternalRefsTable)
			.where(
				and(
					eq(salesExternalRefsTable.externalSource, source),
					eq(salesExternalRefsTable.externalOrderId, extId.toString()),
				),
			)
			.limit(1)

		return existingRef?.orderId
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: SalesOrderCreateDto, actorId: number): Promise<{ id: number }> {
		return record('SalesOrderRepo.create', async () => {
			const {
				locationId,
				customerId,
				salesTypeId,
				status,
				transactionDate,
				totalAmount,
				discountAmount,
				taxAmount,
				gratuityAmount,
				refundAmount,
				items,
			} = data

			const inserted = await this.db.transaction(async (tx) => {
				const metadata = stampCreate(actorId)

				const [order] = await tx
					.insert(salesOrdersTable)
					.values({
						locationId,
						customerId: customerId ?? null,
						salesTypeId,
						status,
						transactionDate,
						totalAmount: totalAmount.toString(),
						discountAmount: discountAmount.toString(),
						taxAmount: taxAmount.toString(),
						gratuityAmount: gratuityAmount?.toString() ?? '0',
						refundAmount: refundAmount?.toString() ?? '0',
						...metadata,
					})
					.returning({ id: salesOrdersTable.id })

				if (items && items.length > 0) {
					await tx.insert(salesOrderItemsTable).values(
						items.map((item) =>
							Object.assign(
								{
									orderId: order!.id,
									batchId: item.batchId ?? null,
									productId: item.productId ?? null,
									variantId: item.variantId ?? null,
									itemName: item.itemName,
									quantity: item.quantity.toString(),
									unitPrice: item.unitPrice.toString(),
									discountAmount: item.discountAmount.toString(),
									taxAmount: item.taxAmount.toString(),
									subtotal: item.subtotal.toString(),
								},
								metadata,
							),
						),
					)
				}

				return { id: order!.id }
			})
			this.#clearCacheAsync()
			return inserted
		})
	}

	async createWithExternalRef(
		data: SalesOrderCreateDto,
		externalRef: { source: string; extId: string; payload: any },
		actorId: number,
	): Promise<{ id: number }> {
		return record('SalesOrderRepo.createWithExternalRef', async () => {
			const inserted = await this.db.transaction(async (tx) => {
				const metadata = stampCreate(actorId)

				const [order] = await tx
					.insert(salesOrdersTable)
					.values({
						locationId: data.locationId,
						customerId: data.customerId ?? null,
						salesTypeId: data.salesTypeId,
						status: data.status,
						transactionDate: data.transactionDate,
						totalAmount: data.totalAmount.toString(),
						discountAmount: data.discountAmount.toString(),
						taxAmount: data.taxAmount.toString(),
						gratuityAmount: data.gratuityAmount?.toString() ?? '0',
						refundAmount: data.refundAmount?.toString() ?? '0',
						...metadata,
					})
					.returning({ id: salesOrdersTable.id })

				if (data.items && data.items.length > 0) {
					await tx.insert(salesOrderItemsTable).values(
						data.items.map((item) => ({
							orderId: order!.id,
							batchId: item.batchId ?? null,
							productId: item.productId ?? null,
							variantId: item.variantId ?? null,
							itemName: item.itemName,
							quantity: item.quantity.toString(),
							unitPrice: item.unitPrice.toString(),
							discountAmount: item.discountAmount.toString(),
							taxAmount: item.taxAmount.toString(),
							subtotal: item.subtotal.toString(),
							...metadata,
						})),
					)
				}

				await tx.insert(salesExternalRefsTable).values({
					orderId: order!.id,
					externalSource: externalRef.source,
					externalOrderId: externalRef.extId,
					rawPayload: externalRef.payload ?? null,
					...metadata,
				})

				return { id: order!.id }
			})
			this.#clearCacheAsync()
			return inserted
		})
	}

	async addBatch(
		orderId: number,
		data: SalesOrderAddBatchDto,
		actorId: number,
	): Promise<{ batchId: number }> {
		return record('SalesOrderRepo.addBatch', async () => {
			const result = await this.db.transaction(async (tx) => {
				const orderResult = await tx
					.select({ status: salesOrdersTable.status })
					.from(salesOrdersTable)
					.where(eq(salesOrdersTable.id, orderId))
				const order = takeFirstOrThrow(orderResult, err.notFound(orderId).message)

				if (order.status !== 'open') throw err.notOpen(orderId)

				const metadata = stampCreate(actorId)

				const [batch] = await tx
					.insert(salesOrderBatchesTable)
					.values({
						orderId,
						batchNumber: data.batchNumber.toString(),
						status: 'pending',
						...metadata,
					})
					.returning({ id: salesOrderBatchesTable.id })

				if (data.items.length > 0) {
					await tx.insert(salesOrderItemsTable).values(
						data.items.map((item) => ({
							orderId,
							batchId: batch!.id,
							productId: item.productId ?? null,
							variantId: item.variantId ?? null,
							itemName: item.itemName,
							quantity: item.quantity.toString(),
							unitPrice: item.unitPrice.toString(),
							discountAmount: item.discountAmount.toString(),
							taxAmount: item.taxAmount.toString(),
							subtotal: item.subtotal.toString(),
							...metadata,
						})),
					)
				}

				await this.#recalculateOrderTotals(tx, orderId, actorId)
				return { batchId: batch!.id }
			})
			this.#clearCacheAsync(orderId)
			return result
		})
	}

	async close(orderId: number, actorId: number): Promise<{ id: number }> {
		return record('SalesOrderRepo.close', async () => {
			await this.db.transaction(async (tx) => {
				const orderResult = await tx
					.select({ status: salesOrdersTable.status })
					.from(salesOrdersTable)
					.where(eq(salesOrdersTable.id, orderId))
				const order = takeFirstOrThrow(orderResult, err.notFound(orderId).message)

				if (order.status !== 'open') throw err.notOpen(orderId)

				await tx
					.update(salesOrdersTable)
					.set({ status: 'closed', ...stampUpdate(actorId) })
					.where(eq(salesOrdersTable.id, orderId))

				// TODO: Add GL posting for manual sales when Finance module integration is ready
				// Similar to Moka sync's postSalesToGL method
			})
			this.#clearCacheAsync(orderId)
			return { id: orderId }
		})
	}

	async void(orderId: number, data: SalesOrderVoidDto, actorId: number): Promise<{ id: number }> {
		return record('SalesOrderRepo.void', async () => {
			await this.db.transaction(async (tx) => {
				const orderResult = await tx
					.select({ status: salesOrdersTable.status })
					.from(salesOrdersTable)
					.where(eq(salesOrdersTable.id, orderId))
				const order = takeFirstOrThrow(orderResult, err.notFound(orderId).message)

				const metadata = stampCreate(actorId)

				await tx.insert(salesVoidsTable).values({
					orderId,
					itemId: data.itemId ?? null,
					reason: data.reason,
					voidedBy: actorId,
					...metadata,
				})

				if (!data.itemId) {
					await tx
						.update(salesOrdersTable)
						.set({ status: 'void', ...stampUpdate(actorId) })
						.where(eq(salesOrdersTable.id, orderId))
				} else {
					const itemResult = await tx
						.select({ id: salesOrderItemsTable.id })
						.from(salesOrderItemsTable)
						.where(eq(salesOrderItemsTable.id, data.itemId))
					takeFirstOrThrow(itemResult, err.itemNotFound(data.itemId).message)

					if (order.status === 'open') {
						await this.#recalculateOrderTotals(tx, orderId, actorId)
					}
				}
			})
			this.#clearCacheAsync(orderId)
			return { id: orderId }
		})
	}
}
