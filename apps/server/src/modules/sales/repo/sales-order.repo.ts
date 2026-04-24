import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'

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
	notOpen: (id: number) =>
		new BadRequestError(`Sales Order ${id} is not open`, 'SALES_ORDER_NOT_OPEN'),
}

export class SalesOrderRepo {
	/* -------------------------------------------------------------------------- */
	/*                                  MUTATION                                  */
	/* -------------------------------------------------------------------------- */

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

	async addBatch(
		orderId: number,
		data: SalesOrderAddBatchDto,
		actorId: number,
	): Promise<{ batchId: number }> {
		return record('SalesOrderRepo.addBatch', async () => {
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

				return { batchId: batch!.id }
			})
		})
	}

	async void(data: SalesOrderVoidDto, actorId: number): Promise<void> {
		return record('SalesOrderRepo.void', async () => {
			const metadata = stampCreate(actorId)

			await db.transaction(async (tx) => {
				await tx.insert(salesVoidsTable).values({
					orderId: data.orderId,
					reason: data.reason,
					...metadata,
				})

				await tx
					.update(salesOrdersTable)
					.set({ status: 'voided', ...stampUpdate(actorId) })
					.where(eq(salesOrdersTable.id, data.orderId))
			})
		})
	}
}
