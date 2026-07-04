import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

import {
	salesInvoicesTable,
	salesInvoiceItemsTable,
} from '@/db/schema'
import { paginate, searchFilter, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	SalesInvoiceDto,
	SalesInvoiceFilterDto,
	SalesInvoiceItemDto,
	SalesInvoiceWithItemsDto,
} from './sales-invoice.contract'

type SalesInvoiceInsert = typeof salesInvoicesTable.$inferInsert
type SalesInvoiceUpdate = PgUpdateSetSource<typeof salesInvoicesTable>
type SalesInvoiceItemInsert = typeof salesInvoiceItemsTable.$inferInsert

export interface ISalesInvoiceRepo {
	readonly db: DbContext
	findPage(filter: SalesInvoiceFilterDto, db?: DbContext): Promise<WithPaginationResult<SalesInvoiceDto>>
	findById(id: number, db?: DbContext): Promise<SalesInvoiceDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<SalesInvoiceDto[]>
	findWithItems(id: number, db?: DbContext): Promise<SalesInvoiceWithItemsDto | undefined>
	findByOrderId(orderId: number, db?: DbContext): Promise<SalesInvoiceDto | undefined>
	insert(data: SalesInvoiceInsert, db?: DbContext): Promise<EntityRef | undefined>
	insertItems(items: SalesInvoiceItemInsert[], db?: DbContext): Promise<void>
	update(id: number, data: SalesInvoiceUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class SalesInvoiceRepo implements ISalesInvoiceRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<
		Pick<SalesInvoiceFilterDto, 'q' | 'status' | 'customerId' | 'locationId' | 'fromDate' | 'toDate'>
	>): SQL | undefined {
		const { q, status, customerId, locationId, fromDate, toDate } = filter
		return and(
			q === undefined ? undefined : searchFilter(salesInvoicesTable.notes, q),
			status === undefined ? undefined : eq(salesInvoicesTable.status, status),
			customerId === undefined ? undefined : eq(salesInvoicesTable.customerId, customerId),
			locationId === undefined ? undefined : eq(salesInvoicesTable.locationId, locationId),
			fromDate === undefined ? undefined : gte(salesInvoicesTable.invoiceDate, fromDate),
			toDate === undefined ? undefined : lte(salesInvoicesTable.invoiceDate, toDate),
		)
	}

	async findPage(
		filter: SalesInvoiceFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<SalesInvoiceDto>> {
		const where = this.#buildWhere(filter)

		return paginate<SalesInvoiceDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(salesInvoicesTable)
					.where(where)
					.orderBy(desc(salesInvoicesTable.invoiceDate))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () =>
				db
					.select({ count: count() })
					.from(salesInvoicesTable)
					.where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<SalesInvoiceDto | undefined> {
		return db
			.select()
			.from(salesInvoicesTable)
			.where(eq(salesInvoicesTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<SalesInvoiceDto[]> {
		if (ids.length === 0) return []
		const { inArray } = await import('drizzle-orm')
		return db
			.select()
			.from(salesInvoicesTable)
			.where(inArray(salesInvoicesTable.id, ids))
	}

	async findWithItems(
		id: number,
		db: DbContext = this.db,
	): Promise<SalesInvoiceWithItemsDto | undefined> {
		const invoice = await this.findById(id, db)
		if (!invoice) return undefined

		const items = await db
			.select()
			.from(salesInvoiceItemsTable)
			.where(eq(salesInvoiceItemsTable.invoiceId, id))

		return { invoice, items: items as SalesInvoiceItemDto[] }
	}

	async findByOrderId(orderId: number, db: DbContext = this.db): Promise<SalesInvoiceDto | undefined> {
		return db
			.select()
			.from(salesInvoicesTable)
			.where(eq(salesInvoicesTable.orderId, orderId))
			.limit(1)
			.then(takeFirst)
	}

	async insert(data: SalesInvoiceInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(salesInvoicesTable)
			.values(data)
			.returning({ id: salesInvoicesTable.id })

		return res
	}

	async insertItems(items: SalesInvoiceItemInsert[], db: DbContext = this.db): Promise<void> {
		if (items.length === 0) return
		await db.insert(salesInvoiceItemsTable).values(items)
	}

	async update(
		id: number,
		data: SalesInvoiceUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(salesInvoicesTable)
			.set(data)
			.where(eq(salesInvoicesTable.id, id))
			.returning({ id: salesInvoicesTable.id })

		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(salesInvoicesTable)
			.where(eq(salesInvoicesTable.id, id))
			.returning({ id: salesInvoicesTable.id })

		return res
	}
}
