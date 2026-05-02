import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	paginate,
	searchFilter,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'
import { logger } from '@/core/logger'

import { salesInvoicesTable, salesInvoiceItemsTable, salesOrderItemsTable } from '@/db/schema'

import * as dto from './sales-invoice.dto'

const SALES_INVOICE_CACHE_NAMESPACE = 'sales-invoice'

export class SalesInvoiceRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(SALES_INVOICE_CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */
	#clearCache(id?: number): Promise<void> {
		return record('SalesInvoiceRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await this.cache.deleteMany({ keys })
		})
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'SalesInvoiceRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: dto.SalesInvoiceFilterDto,
	): Promise<WithPaginationResult<dto.SalesInvoiceDto>> {
		return record('SalesInvoiceRepo.getListPaginated', async () => {
			const { q, page, limit, status, customerId, locationId, fromDate, toDate } = filter
			const where = and(
				q === undefined ? undefined : searchFilter(salesInvoicesTable.notes, q),
				status === undefined ? undefined : eq(salesInvoicesTable.status, status),
				customerId === undefined ? undefined : eq(salesInvoicesTable.customerId, customerId),
				locationId === undefined ? undefined : eq(salesInvoicesTable.locationId, locationId),
				fromDate === undefined ? undefined : gte(salesInvoicesTable.invoiceDate, fromDate),
				toDate === undefined ? undefined : lte(salesInvoicesTable.invoiceDate, toDate),
			)

			return paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(salesInvoicesTable)
						.where(where)
						.orderBy(desc(salesInvoicesTable.invoiceDate))
						.limit(limit)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(salesInvoicesTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<dto.SalesInvoiceDto | undefined> {
		return record('SalesInvoiceRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await this.db
						.select()
						.from(salesInvoicesTable)
						.where(eq(salesInvoicesTable.id, id))
						.limit(1)
						.then(takeFirst)

					return res ?? skip()
				},
			})
		})
	}

	async getWithItems(id: number): Promise<dto.SalesInvoiceWithItemsDto | undefined> {
		return record('SalesInvoiceRepo.getWithItems', async () => {
			const invoice = await this.getById(id)
			if (!invoice) return undefined

			const items = await this.db
				.select()
				.from(salesInvoiceItemsTable)
				.where(eq(salesInvoiceItemsTable.invoiceId, id))

			return { invoice, items }
		})
	}

	async getByOrderId(orderId: number): Promise<dto.SalesInvoiceDto | undefined> {
		return record('SalesInvoiceRepo.getByOrderId', async () => {
			const res = await this.db
				.select()
				.from(salesInvoicesTable)
				.where(eq(salesInvoicesTable.orderId, orderId))
				.limit(1)
				.then(takeFirst)

			return res
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.SalesInvoiceCreateDto, actorId: number): Promise<number | undefined> {
		return record('SalesInvoiceRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(salesInvoicesTable)
				.values({ ...data, ...metadata })
				.returning({ id: salesInvoicesTable.id })

			this.#clearCacheAsync()
			return res?.id
		})
	}

	async update(data: dto.SalesInvoiceUpdateDto, actorId: number): Promise<number | undefined> {
		return record('SalesInvoiceRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(salesInvoicesTable)
				.set({ ...data, ...metadata })
				.where(eq(salesInvoicesTable.id, data.id))
				.returning({ id: salesInvoicesTable.id })

			this.#clearCacheAsync(data.id)
			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('SalesInvoiceRepo.remove', async () => {
			const [res] = await this.db
				.delete(salesInvoicesTable)
				.where(eq(salesInvoicesTable.id, id))
				.returning({ id: salesInvoicesTable.id })

			this.#clearCacheAsync(id)
			return res?.id
		})
	}

	async generateFromOrder(
		orderId: number,
		data: Omit<dto.SalesInvoiceCreateDto, 'orderId'>,
		actorId: number,
	): Promise<number | undefined> {
		return record('SalesInvoiceRepo.generateFromOrder', async () => {
			// Get order items to copy to invoice
			const orderItems = await this.db
				.select()
				.from(salesOrderItemsTable)
				.where(eq(salesOrderItemsTable.orderId, orderId))

			// Create invoice
			const invoiceId = await this.create({ orderId, ...data }, actorId)
			if (!invoiceId) return undefined

			// Create invoice items from order items
			for (const item of orderItems) {
				const metadata = stampCreate(actorId)
				await this.db.insert(salesInvoiceItemsTable).values({
					invoiceId,
					salesOrderItemId: item.id,
					productId: item.productId,
					variantId: item.variantId,
					itemName: item.itemName,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					taxAmount: item.taxAmount,
					discountAmount: item.discountAmount,
					subtotal: item.subtotal,
					...metadata,
				})
			}

			return invoiceId
		})
	}
}
