import { record } from '@elysiajs/opentelemetry'
import { count, eq } from 'drizzle-orm'

import { cache } from '@/core/cache'
import {
	checkConflict,
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirstOrThrow,
	type ConflictField,
} from '@/core/database'
import { BadRequestError, InternalServerError, NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import { salesTypesTable } from '@/db/schema'

import type { SalesTypeDto, SalesTypeFilterDto, SalesTypeMutationDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Sales type with ID ${id} not found`, 'SALES_TYPE_NOT_FOUND'),
	systemSalesType: () =>
		new BadRequestError('Cannot mutate a system sales type', 'SALES_TYPE_IS_SYSTEM'),
	createFailed: () =>
		new InternalServerError('Sales type creation failed', 'SALES_TYPE_CREATE_FAILED'),
}

const uniqueFields: ConflictField<'code'>[] = [
	{
		field: 'code',
		column: salesTypesTable.code,
		message: 'Sales type code already exists',
		code: 'SALES_TYPE_CODE_ALREADY_EXISTS',
	},
]

const cacheKey = {
	count: 'salesType.count',
	list: 'salesType.list',
	byId: (id: number) => `salesType.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class SalesTypeService {
	/**
	 * Returns all sales types, cached.
	 */
	async find(): Promise<SalesTypeDto[]> {
		return record('SalesTypeService.find', async () => {
			return cache.wrap(cacheKey.list, async () => {
				return db.select().from(salesTypesTable).orderBy(salesTypesTable.name)
			})
		})
	}

	/**
	 * Finds a single sales type by ID. Throws if not found.
	 */
	async getById(id: number): Promise<SalesTypeDto> {
		return record('SalesTypeService.getById', async () => {
			return cache.wrap(cacheKey.byId(id), async () => {
				const result = await db.select().from(salesTypesTable).where(eq(salesTypesTable.id, id))
				return takeFirstOrThrow(
					result,
					`Sales type with ID ${id} not found`,
					'SALES_TYPE_NOT_FOUND',
				)
			})
		})
	}

	/**
	 * Returns total count of sales types, cached.
	 */
	async count(): Promise<number> {
		return record('SalesTypeService.count', async () => {
			return cache.wrap(cacheKey.count, async () => {
				const result = await db.select({ val: count() }).from(salesTypesTable)
				return result[0]?.val ?? 0
			})
		})
	}

	/**
	 * Fetches paginated list of sales types.
	 */
	async handleList(
		filter: SalesTypeFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<SalesTypeDto>> {
		return record('SalesTypeService.handleList', async () => {
			const { search } = filter
			const where = searchFilter(salesTypesTable.name, search)

			return paginate<SalesTypeDto>({
				data: ({ limit, offset }) =>
					db
						.select()
						.from(salesTypesTable)
						.where(where)
						.orderBy(sortBy(salesTypesTable.updatedAt, 'desc'))
						.limit(limit)
						.offset(offset),
				pq,
				countQuery: db.select({ count: count() }).from(salesTypesTable).where(where),
			})
		})
	}

	/**
	 * Serves sales type detail.
	 */
	async handleDetail(id: number): Promise<SalesTypeDto> {
		return record('SalesTypeService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	/**
	 * Seeds sales types
	 */
	async seed(data: (SalesTypeMutationDto & { id?: number; createdBy: number })[]): Promise<void> {
		return record('SalesTypeService.seed', async () => {
			for (const d of data) {
				const metadata = stampCreate(d.createdBy)

				await db
					.insert(salesTypesTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: salesTypesTable.code,
						set: {
							name: d.name,
							isSystem: d.isSystem,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
						},
					})
			}
			await this.clearCache()
		})
	}

	/**
	 * Creates a new sales type. Invalidates cache.
	 */
	async handleCreate(data: SalesTypeMutationDto, actorId: number): Promise<{ id: number }> {
		return record('SalesTypeService.handleCreate', async () => {
			const code = data.code.trim().toLowerCase()
			const name = data.name.trim()

			await checkConflict({
				table: salesTypesTable,
				pkColumn: salesTypesTable.id,
				fields: uniqueFields,
				input: { code },
			})

			const [inserted] = await db
				.insert(salesTypesTable)
				.values({ ...data, code, name, isSystem: false, ...stampCreate(actorId) })
				.returning({ id: salesTypesTable.id })

			if (!inserted) throw err.createFailed()

			await this.clearCache()
			return inserted
		})
	}

	/**
	 * Updates existing sales type. Invalidates cache.
	 */
	async handleUpdate(
		id: number,
		data: Partial<SalesTypeMutationDto>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('SalesTypeService.handleUpdate', async () => {
			const existing = await this.getById(id)

			if (existing.isSystem) throw err.systemSalesType()

			const code = data.code ? data.code.trim().toLowerCase() : existing.code
			const name = data.name ? data.name.trim() : existing.name

			await checkConflict({
				table: salesTypesTable,
				pkColumn: salesTypesTable.id,
				fields: uniqueFields,
				input: { code },
				existing,
			})

			await db
				.update(salesTypesTable)
				.set({ ...data, code, name, isSystem: false, ...stampUpdate(actorId) })
				.where(eq(salesTypesTable.id, id))

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Removes sales type. Invalidates cache.
	 */
	async handleRemove(id: number): Promise<{ id: number }> {
		return record('SalesTypeService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (existing.isSystem) throw err.systemSalesType()

			const result = await db
				.delete(salesTypesTable)
				.where(eq(salesTypesTable.id, id))
				.returning({ id: salesTypesTable.id })
			if (result.length === 0) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Clears relevant sales type caches.
	 */
	private async clearCache(id?: number) {
		await Promise.all([
			cache.del(cacheKey.count),
			cache.del(cacheKey.list),
			id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
		])
	}
}
