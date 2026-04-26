import { record } from '@elysiajs/opentelemetry'
import { count, eq } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import {
	checkConflict,
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	type ConflictField,
	type WithPaginationResult,
} from '@/core/database'
import { BadRequestError, InternalServerError, NotFoundError } from '@/core/http/errors'

import { db } from '@/db'
import { salesTypesTable } from '@/db/schema'

import { SalesTypeCreateDto, SalesTypeDto, SalesTypeFilterDto, SalesTypeUpdateDto } from '../dto'

const cache = bento.namespace('sales-type')

const uniqueFields: ConflictField<'code'>[] = [
	{
		field: 'code',
		column: salesTypesTable.code,
		message: 'Sales type code already exists',
		code: 'SALES_TYPE_CODE_ALREADY_EXISTS',
	},
]

export class SalesTypeRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.count, CACHE_KEY_DEFAULT.list]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await cache.deleteMany({ keys })
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<SalesTypeDto | undefined> {
		return record('SalesTypeRepo.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const result = await db.select().from(salesTypesTable).where(eq(salesTypesTable.id, id))
					if (result.length === 0) return skip()
					return SalesTypeDto.parse(result[0])
				},
			})
		})
	}

	async getListPaginated(filter: SalesTypeFilterDto): Promise<WithPaginationResult<SalesTypeDto>> {
		return record('SalesTypeRepo.getListPaginated', async () => {
			const { q, page, limit } = filter
			const where = searchFilter(salesTypesTable.name, q)

			return paginate({
				data: async ({ limit: l, offset }) => {
					const rows = await db
						.select()
						.from(salesTypesTable)
						.where(where)
						.orderBy(sortBy(salesTypesTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows.map((r) => SalesTypeDto.parse(r))
				},
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(salesTypesTable).where(where),
			})
		})
	}

	async getAll(): Promise<SalesTypeDto[]> {
		return record('SalesTypeRepo.getAll', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => {
					const rows = await db.select().from(salesTypesTable).orderBy(salesTypesTable.name)
					return rows.map((r) => SalesTypeDto.parse(r))
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async seed(data: (SalesTypeCreateDto & { id?: number; createdBy: number })[]): Promise<void> {
		return record('SalesTypeRepo.seed', async () => {
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
			void this.#clearCache()
		})
	}

	async create(data: SalesTypeCreateDto, actorId: number): Promise<{ id: number }> {
		return record('SalesTypeRepo.create', async () => {
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

			if (!inserted)
				throw new InternalServerError('Sales type creation failed', 'SALES_TYPE_CREATE_FAILED')

			void this.#clearCache()
			return inserted
		})
	}

	async update(
		id: number,
		data: Partial<SalesTypeUpdateDto>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('SalesTypeRepo.update', async () => {
			const existing = await this.getById(id)
			if (!existing)
				throw new NotFoundError(`Sales type with ID ${id} not found`, 'SALES_TYPE_NOT_FOUND')
			if (existing.isSystem)
				throw new BadRequestError('Cannot mutate a system sales type', 'SALES_TYPE_IS_SYSTEM')

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

			void this.#clearCache(id)
			return { id }
		})
	}

	async delete(id: number): Promise<{ id: number }> {
		return record('SalesTypeRepo.delete', async () => {
			const existing = await this.getById(id)
			if (!existing)
				throw new NotFoundError(`Sales type with ID ${id} not found`, 'SALES_TYPE_NOT_FOUND')
			if (existing.isSystem)
				throw new BadRequestError('Cannot mutate a system sales type', 'SALES_TYPE_IS_SYSTEM')

			const result = await db
				.delete(salesTypesTable)
				.where(eq(salesTypesTable.id, id))
				.returning({ id: salesTypesTable.id })

			if (result.length === 0)
				throw new NotFoundError(`Sales type with ID ${id} not found`, 'SALES_TYPE_NOT_FOUND')

			void this.#clearCache(id)
			return { id }
		})
	}
}
