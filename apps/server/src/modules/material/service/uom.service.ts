import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

import { bento } from '@/core/cache'
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
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import { uomsTable } from '@/db/schema'

import type { UomDto, UomFilterDto, UomMutationDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
	notFound: (id: number) => new NotFoundError(`UOM with ID ${id} not found`, 'UOM_NOT_FOUND'),
	createFailed: () => new InternalServerError('UOM creation failed', 'UOM_CREATE_FAILED'),
}

const uniqueFields: ConflictField<'code'>[] = [
	{
		field: 'code',
		column: uomsTable.code,
		message: 'UOM code already exists',
		code: 'UOM_CODE_ALREADY_EXISTS',
	},
]

const cache = bento.namespace('uom')

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class UomService {
	/**
	 * Returns all UOMs, cached.
	 */
	async find(): Promise<UomDto[]> {
		return record('UomService.find', async () => {
			return cache.getOrSet({
				key: 'list',
				factory: async () => {
					return db
						.select()
						.from(uomsTable)
						.where(isNull(uomsTable.deletedAt))
						.orderBy(uomsTable.code)
				},
			})
		})
	}

	/**
	 * Finds a single UOM by ID. Throws if not found.
	 */
	async getById(id: number): Promise<UomDto> {
		return record('UomService.getById', async () => {
			return cache.getOrSet({
				key: `${id}`,
				factory: async () => {
					const result = await db
						.select()
						.from(uomsTable)
						.where(and(eq(uomsTable.id, id), isNull(uomsTable.deletedAt)))
					return takeFirstOrThrow(result, `UOM with ID ${id} not found`)
				},
			})
		})
	}

	/**
	 * Returns total count of UOMs, cached.
	 */
	async count(): Promise<number> {
		return record('UomService.count', async () => {
			return cache.getOrSet({
				key: 'count',
				factory: async () => {
					const result = await db
						.select({ val: count() })
						.from(uomsTable)
						.where(isNull(uomsTable.deletedAt))
					return result[0]?.val ?? 0
				},
			})
		})
	}

	/**
	 * Fetches paginated list of UOMs.
	 */
	async handleList(
		filter: UomFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<UomDto>> {
		return record('UomService.handleList', async () => {
			const { q } = filter
			const where = and(isNull(uomsTable.deletedAt), searchFilter(uomsTable.code, q))

			return paginate<UomDto>({
				data: ({ limit, offset }) =>
					db
						.select()
						.from(uomsTable)
						.where(where)
						.orderBy(sortBy(uomsTable.updatedAt, 'desc'))
						.limit(limit)
						.offset(offset),
				pq,
				countQuery: db.select({ count: count() }).from(uomsTable).where(where),
			})
		})
	}

	/**
	 * Serves UOM detail.
	 */
	async handleDetail(id: number): Promise<UomDto> {
		return record('UomService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	/**
	 * Creates a new UOM. Invalidates cache.
	 */
	async handleCreate(data: UomMutationDto, actorId: number): Promise<{ id: number }> {
		return record('UomService.handleCreate', async () => {
			const code = data.code.toUpperCase().trim()

			await checkConflict({
				table: uomsTable,
				pkColumn: uomsTable.id,
				fields: uniqueFields,
				input: { code },
			})

			const [inserted] = await db
				.insert(uomsTable)
				.values({ code, ...stampCreate(actorId) })
				.returning({ id: uomsTable.id })

			if (!inserted) throw err.createFailed()

			await this.clearCache()
			return inserted
		})
	}

	/**
	 * Updates existing UOM. Invalidates cache.
	 */
	async handleUpdate(
		id: number,
		data: Partial<UomMutationDto>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UomService.handleUpdate', async () => {
			const existing = await this.getById(id)

			const code = data.code ? data.code.toUpperCase().trim() : existing.code

			await checkConflict({
				table: uomsTable,
				pkColumn: uomsTable.id,
				fields: uniqueFields,
				input: { code },
				existing,
			})

			await db
				.update(uomsTable)
				.set({ code, ...stampUpdate(actorId) })
				.where(eq(uomsTable.id, id))

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Marks a UOM as deleted (Soft Delete).
	 */
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('UomService.handleRemove', async () => {
			const result = await db
				.update(uomsTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(uomsTable.id, id))
				.returning({ id: uomsTable.id })

			if (result.length === 0) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Permanently deletes a UOM (Hard Delete).
	 * USE WITH CAUTION.
	 */
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('UomService.handleHardRemove', async () => {
			const result = await db
				.delete(uomsTable)
				.where(eq(uomsTable.id, id))
				.returning({ id: uomsTable.id })
			if (result.length === 0) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Clears relevant UOM caches.
	 */
	private async clearCache(id?: number) {
		const keys = ['count', 'list']
		if (id) keys.push(`${id}`)
		await cache.deleteMany({ keys })
	}

	/**
	 * Seed UOMs by skipping already existing ones.
	 */
	async seed(data: { code: string; createdBy: number }[]): Promise<void> {
		return record('UomService.seed', async () => {
			const existing = await db
				.select({ code: uomsTable.code })
				.from(uomsTable)
				.where(isNull(uomsTable.deletedAt))
			const existingCodes = new Set(existing.map((e) => e.code))

			const newUoms = data
				.map((d) => ({ ...d, code: d.code.toUpperCase().trim() }))
				.filter((d) => !existingCodes.has(d.code))

			if (newUoms.length === 0) return

			await db
				.insert(uomsTable)
				.values(newUoms.map((d) => Object.assign({}, d, stampCreate(d.createdBy))))

			await this.clearCache()
		})
	}
}
