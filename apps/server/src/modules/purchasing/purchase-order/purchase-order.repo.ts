import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull, or } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	type WithPaginationResult,
	type DbClient,
} from '@/core/database'

import { purchaseOrderItemsTable, purchaseOrdersTable } from '@/db/schema'

import {
	PurchaseOrderCreateDto,
	PurchaseOrderDto,
	PurchaseOrderFilterDto,
	PurchaseOrderSelectDto,
	type PurchaseOrderStatus,
	PurchaseOrderUpdateDto,
} from './purchase-order.dto'

export class PurchaseOrderRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<PurchaseOrderDto | undefined> {
		return record('PurchaseOrderRepo.getById', async () => {
			const [order] = await this.db
				.select()
				.from(purchaseOrdersTable)
				.where(and(eq(purchaseOrdersTable.id, id), isNull(purchaseOrdersTable.deletedAt)))

			if (!order) return undefined

			const items = await this.db
				.select()
				.from(purchaseOrderItemsTable)
				.where(
					and(eq(purchaseOrderItemsTable.orderId, id), isNull(purchaseOrderItemsTable.deletedAt)),
				)

			return PurchaseOrderDto.parse({ ...order, items })
		})
	}

	async getListPaginated(
		filter: PurchaseOrderFilterDto,
	): Promise<WithPaginationResult<PurchaseOrderSelectDto>> {
		return record('PurchaseOrderRepo.getListPaginated', async () => {
			const { q, page, limit, status, locationId, supplierId } = filter
			const where = and(
				isNull(purchaseOrdersTable.deletedAt),
				q === undefined ? undefined : or(searchFilter(purchaseOrdersTable.notes, q)),
				status === undefined ? undefined : eq(purchaseOrdersTable.status, status),
				locationId === undefined ? undefined : eq(purchaseOrdersTable.locationId, locationId),
				supplierId === undefined ? undefined : eq(purchaseOrdersTable.supplierId, supplierId),
			)

			return paginate({
				data: async ({ limit: l, offset }) => {
					const rows = await this.db
						.select()
						.from(purchaseOrdersTable)
						.where(where)
						.orderBy(sortBy(purchaseOrdersTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows.map((r) => PurchaseOrderSelectDto.parse(r))
				},
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(purchaseOrdersTable).where(where),
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: PurchaseOrderCreateDto, actorId: number): Promise<{ id: number }> {
		return record('PurchaseOrderRepo.create', async () => {
			const result = await this.db.transaction(async (tx) => {
				const { items, ...orderData } = data
				const meta = stampCreate(actorId)

				const [insertedOrder] = await tx
					.insert(purchaseOrdersTable)
					.values({
						...orderData,
						totalAmount: orderData.totalAmount?.toString() ?? '0',
						discountAmount: orderData.discountAmount?.toString() ?? '0',
						taxAmount: orderData.taxAmount?.toString() ?? '0',
						...meta,
					})
					.returning({ id: purchaseOrdersTable.id })

				if (!insertedOrder) throw new Error('Create PO failed')

				const itemValues = items.map((item) => ({
					materialId: item.materialId,
					itemName: item.itemName,
					quantity: item.quantity?.toString(),
					unitPrice: item.unitPrice?.toString(),
					discountAmount: item.discountAmount?.toString(),
					taxAmount: item.taxAmount?.toString(),
					subtotal: item.subtotal?.toString(),
					orderId: insertedOrder.id,
					...meta,
				}))

				await tx.insert(purchaseOrderItemsTable).values(itemValues)

				return insertedOrder
			})
			return result
		})
	}

	async update(data: PurchaseOrderUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('PurchaseOrderRepo.update', async () => {
			const { id, items, ...orderData } = data
			const updateMeta = stampUpdate(actorId)
			const createMeta = stampCreate(actorId)

			const result = await this.db.transaction(async (tx) => {
				await tx
					.update(purchaseOrdersTable)
					.set({
						...orderData,
						totalAmount: orderData.totalAmount?.toString(),
						discountAmount: orderData.discountAmount?.toString(),
						taxAmount: orderData.taxAmount?.toString(),
						...updateMeta,
					})
					.where(eq(purchaseOrdersTable.id, id))

				if (items) {
					await tx.delete(purchaseOrderItemsTable).where(eq(purchaseOrderItemsTable.orderId, id))
					if (items.length > 0) {
						const itemValues = items.map((item) => ({
							materialId: item.materialId,
							itemName: item.itemName,
							quantity: item.quantity?.toString(),
							unitPrice: item.unitPrice?.toString(),
							discountAmount: item.discountAmount?.toString(),
							taxAmount: item.taxAmount?.toString(),
							subtotal: item.subtotal?.toString(),
							orderId: id,
							...createMeta,
						}))
						await tx.insert(purchaseOrderItemsTable).values(itemValues)
					}
				}

				return { id }
			})
			return result
		})
	}

	async softDelete(id: number, actorId: number): Promise<{ id: number }> {
		return record('PurchaseOrderRepo.softDelete', async () => {
			const [result] = await this.db
				.update(purchaseOrdersTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(purchaseOrdersTable.id, id))
				.returning({ id: purchaseOrdersTable.id })
			if (!result) throw new Error('Purchase Order not found')
			return result
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('PurchaseOrderRepo.hardDelete', async () => {
			const [result] = await this.db
				.delete(purchaseOrdersTable)
				.where(eq(purchaseOrdersTable.id, id))
				.returning({ id: purchaseOrdersTable.id })
			if (!result) throw new Error('Purchase Order not found')
			return result
		})
	}

	async updateStatus(
		id: number,
		status: PurchaseOrderStatus,
		actorId: number,
	): Promise<{ id: number }> {
		return record('PurchaseOrderRepo.updateStatus', async () => {
			const updateMeta = stampUpdate(actorId)
			const [result] = await this.db
				.update(purchaseOrdersTable)
				.set({ status, ...updateMeta })
				.where(eq(purchaseOrdersTable.id, id))
				.returning({ id: purchaseOrdersTable.id })
			if (!result) throw new Error('Purchase Order not found')
			return result
		})
	}
}
