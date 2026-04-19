// oxlint-disable typescript/unbound-method
// TODO
import { record } from '@elysiajs/opentelemetry'
import { bento } from '@/core/cache'
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'

const cache = bento.namespace('sales.order')

import { paginate, stampCreate, stampUpdate, takeFirstOrThrow } from '@/core/database'
import { BadRequestError, NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import {
	salesExternalRefsTable,
	salesOrderBatchesTable,
	salesOrderItemsTable,
	salesOrdersTable,
	salesVoidsTable,
} from '@/db/schema/sales'

import type {
	SalesOrderAddBatchDto,
	SalesOrderCreateDto,
	SalesOrderDto,
	SalesOrderFilterDto,
	SalesOrderOutputDto,
	SalesOrderVoidDto,
} from '../dto'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Sales Order ${id} not found`, 'SALES_ORDER_NOT_FOUND'),
	itemNotFound: (id: number) =>
		new NotFoundError(`Sales Order Item ${id} not found`, 'SALES_ORDER_ITEM_NOT_FOUND'),
	notOpen: (id: number) =>
		new BadRequestError(`Sales Order ${id} is not open`, 'SALES_ORDER_NOT_OPEN'),
}

export class SalesOrderService {
	/* ──────────────────── HANDLER: CREATE / OPEN BILL ──────────────────── */

	async handleCreate(data: SalesOrderCreateDto, actorId: number): Promise<{ id: number }> {
		return record('SalesOrderService.handleCreate', async () => {
			const {
				locationId,
				customerId,
				salesTypeId,
				status,
				transactionDate,
				totalAmount,
				discountAmount,
				taxAmount,
				items,
			} = data

			return db.transaction(async (tx) => {
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
		})
	}

	/* ──────────────────── HANDLER: ADD BATCH ──────────────────── */

	async handleAddBatch(
		orderId: number,
		data: SalesOrderAddBatchDto,
		actorId: number,
	): Promise<{ batchId: number }> {
		return record('SalesOrderService.handleAddBatch', async () => {
			return db.transaction(async (tx) => {
				// Validate order is open
				const orderResult = await tx
					.select({ status: salesOrdersTable.status })
					.from(salesOrdersTable)
					.where(eq(salesOrdersTable.id, orderId))
				const order = takeFirstOrThrow(
					orderResult,
					err.notFound(orderId).message,
					'SALES_ORDER_NOT_FOUND',
				)

				if (order.status !== 'open') throw err.notOpen(orderId)

				const metadata = stampCreate(actorId)

				// Create Batch
				const [batch] = await tx
					.insert(salesOrderBatchesTable)
					.values({
						orderId,
						batchNumber: data.batchNumber.toString(),
						status: 'pending',
						...metadata,
					})
					.returning({ id: salesOrderBatchesTable.id })

				// Create Items Link to Batch
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

				// Recalculate totals
				await this.recalculateOrderTotals(tx, orderId, actorId)

				const batchId = batch!.id
				await this.clearCache(orderId)
				return { batchId }
			})
		})
	}

	/* ──────────────────── HANDLER: CLOSE BILL ──────────────────── */

	async handleClose(orderId: number, actorId: number): Promise<{ id: number }> {
		return record('SalesOrderService.handleClose', async () => {
			await db.transaction(async (tx) => {
				const orderResult = await tx
					.select({ status: salesOrdersTable.status })
					.from(salesOrdersTable)
					.where(eq(salesOrdersTable.id, orderId))
				const order = takeFirstOrThrow(
					orderResult,
					err.notFound(orderId).message,
					'SALES_ORDER_NOT_FOUND',
				)

				if (order.status !== 'open') throw err.notOpen(orderId)

				const metadata = stampUpdate(actorId)

				await tx
					.update(salesOrdersTable)
					.set({ status: 'closed', ...metadata })
					.where(eq(salesOrdersTable.id, orderId))
			})

			return { id: orderId }
		})
	}

	/* ──────────────────── HANDLER: VOID ──────────────────── */

	async handleVoid(
		orderId: number,
		data: SalesOrderVoidDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('SalesOrderService.handleVoid', async () => {
			await db.transaction(async (tx) => {
				const orderResult = await tx
					.select({ status: salesOrdersTable.status })
					.from(salesOrdersTable)
					.where(eq(salesOrdersTable.id, orderId))
				const order = takeFirstOrThrow(
					orderResult,
					err.notFound(orderId).message,
					'SALES_ORDER_NOT_FOUND',
				)

				const metadata = stampCreate(actorId)

				// Record void
				await tx.insert(salesVoidsTable).values({
					orderId,
					itemId: data.itemId ?? null,
					reason: data.reason,
					voidedBy: actorId,
					...metadata,
				})

				// oxlint-disable-next-line no-negated-condition
				if (!data.itemId) {
					// Void the entire order
					const updateMetadata = stampUpdate(actorId)
					await tx
						.update(salesOrdersTable)
						.set({ status: 'void', ...updateMetadata })
						.where(eq(salesOrdersTable.id, orderId))
				} else {
					// Ensure the item exists
					const itemResult = await tx
						.select({ id: salesOrderItemsTable.id })
						.from(salesOrderItemsTable)
						.where(eq(salesOrderItemsTable.id, data.itemId))
					takeFirstOrThrow(
						itemResult,
						err.itemNotFound(data.itemId).message,
						'SALES_ORDER_ITEM_NOT_FOUND',
					)

					// If only specific item is voided and order is open, we can recalculate totals.
					// Note: Full ERP might zero out the item line or just exclude it in recalculations.
					if (order.status === 'open') {
						await this.recalculateOrderTotals(tx, orderId, actorId)
					}
				}
			})

			return { id: orderId }
		})
	}

	/* ──────────────────── HANDLER: EXTERNAL INGESTION  ──────────────────── */

	async handleExternalIngestion(
		data: SalesOrderCreateDto,
		externalRef: { source: string; extId: string; payload: any },
		actorId: number,
	): Promise<{ id: number }> {
		return record('SalesOrderService.handleExternalIngestion', async () => {
			return db.transaction(async (tx) => {
				const existingRef = await tx
					.select({ orderId: salesExternalRefsTable.orderId })
					.from(salesExternalRefsTable)
					.where(
						and(
							eq(salesExternalRefsTable.externalSource, externalRef.source),
							eq(salesExternalRefsTable.externalOrderId, externalRef.extId),
						),
					)
					.limit(1)

				if (existingRef.length > 0) {
					// Return existing ID if deduplicated
					return { id: existingRef[0]!.orderId }
				}

				const metadata = stampCreate(actorId)

				// Create the order using similar logic to handleCreate
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
		})
	}

	/* ──────────────────── HANDLER: LIST ──────────────────── */

	async handleList(
		filter: SalesOrderFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<SalesOrderDto>> {
		return record('SalesOrderService.handleList', async () => {
			const { locationId, status, salesTypeId, startDate, endDate } = filter

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
				data: ({ limit, offset }) =>
					db
						.select()
						.from(salesOrdersTable)
						.where(where)
						.orderBy(desc(salesOrdersTable.transactionDate))
						.limit(limit)
						.offset(offset),
				pq,
				countQuery: db.select({ count: count() }).from(salesOrdersTable).where(where),
			})

			const data = result.data.map((r) => this.mapOrder(r))

			return { data, meta: result.meta }
		})
	}

	/* ──────────────────── HANDLER: DETAIL ──────────────────── */

	async handleDetail(id: number): Promise<SalesOrderOutputDto> {
		return record('SalesOrderService.handleDetail', async () => {
			return cache.getOrSet({
				key: `${id}`,
				factory: async () => {
					const result = await db.select().from(salesOrdersTable).where(eq(salesOrdersTable.id, id))
					const row = takeFirstOrThrow(result, err.notFound(id).message, 'SALES_ORDER_NOT_FOUND')

					const [items, batches, voids] = await Promise.all([
						db.select().from(salesOrderItemsTable).where(eq(salesOrderItemsTable.orderId, id)),
						db.select().from(salesOrderBatchesTable).where(eq(salesOrderBatchesTable.orderId, id)),
						db.select().from(salesVoidsTable).where(eq(salesVoidsTable.orderId, id)),
					])

					return {
						...this.mapOrder(row),
						items: items.map(this.mapItem),
						batches: batches.map(this.mapBatch),
						voids: voids.map(this.mapVoid),
					}
				},
			})
		})
	}

	/* ──────────────────── INTERNAL HELPERS ──────────────────── */

	private async recalculateOrderTotals(tx: any, orderId: number, actorId: number) {
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

		let totalAmount = 0
		let discountAmount = 0
		let taxAmount = 0

		for (const item of allItems) {
			if (!voidedItemIds.has(item.id)) {
				totalAmount += Number(item.subtotal)
				discountAmount += Number(item.discountAmount)
				taxAmount += Number(item.taxAmount)
			}
		}

		const metadata = stampUpdate(actorId)
		await tx
			.update(salesOrdersTable)
			.set({
				totalAmount: totalAmount.toString(),
				discountAmount: discountAmount.toString(),
				taxAmount: taxAmount.toString(),
				...metadata,
			})
			.where(eq(salesOrdersTable.id, orderId))
	}

	private mapOrder(row: any): SalesOrderDto {
		return {
			...row,
			totalAmount: row.totalAmount, // DTO expects decimal string
			discountAmount: row.discountAmount,
			taxAmount: row.taxAmount,
		}
	}

	private mapItem(row: any) {
		return { ...row }
	}

	private mapBatch(row: any) {
		return { ...row }
	}

	private mapVoid(row: any) {
		return { ...row }
	}

	private async clearCache(id?: number) {
		const keys = ['list', 'count']
		if (id) keys.push(`${id}`)
		await cache.deleteMany({ keys })
	}
}
