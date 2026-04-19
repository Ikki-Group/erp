import { record } from '@elysiajs/opentelemetry'
import { and, eq, ilike, count, isNull, or } from 'drizzle-orm'

import { bento } from '@/core/cache'
import {
	checkConflict,
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirstOrThrow,
} from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import { suppliersTable } from '@/db/schema/supplier'

import {
	SupplierDto,
	type SupplierCreateDto,
	type SupplierFilterDto,
	type SupplierUpdateDto,
} from '../dto/supplier.dto'

const cache = bento.namespace('supplier')

export class SupplierService {
	async handleList(
		filter: SupplierFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<SupplierDto>> {
		return record('SupplierService.handleList', async () => {
			const { q } = filter

			const searchCondition = q
				? or(ilike(suppliersTable.name, `%${q}%`), ilike(suppliersTable.code, `%${q}%`))
				: undefined

			const where = and(isNull(suppliersTable.deletedAt), searchCondition)

			const result = await paginate({
				data: ({ limit, offset }) =>
					db
						.select()
						.from(suppliersTable)
						.where(where)
						.orderBy(sortBy(suppliersTable.updatedAt, 'desc'))
						.limit(limit)
						.offset(offset),
				pq,
				countQuery: db.select({ count: count() }).from(suppliersTable).where(where),
			})

			return { data: result.data.map((row) => SupplierDto.parse(row)), meta: result.meta }
		})
	}

	async handleDetail(id: number): Promise<SupplierDto> {
		return record('SupplierService.handleDetail', async () => {
			return cache.getOrSet({
				key: `${id}`,
				factory: async () => {
					const rows = await db
						.select()
						.from(suppliersTable)
						.where(and(eq(suppliersTable.id, id), isNull(suppliersTable.deletedAt)))

					return SupplierDto.parse(
						takeFirstOrThrow(rows, `Supplier ${id} not found`, 'SUPPLIER_NOT_FOUND'),
					)
				},
			})
		})
	}

	async handleCreate(data: SupplierCreateDto, userId: number): Promise<{ id: number }> {
		return record('SupplierService.handleCreate', async () => {
			await checkConflict({
				table: suppliersTable,
				pkColumn: suppliersTable.id,
				fields: [
					{
						field: 'code',
						column: suppliersTable.code,
						message: 'Supplier code already exists',
						code: 'SUPPLIER_CODE_ALREADY_EXISTS',
					},
				],
				input: data,
			})

			const stamps = stampCreate(userId)
			const rows = await db
				.insert(suppliersTable)
				.values({ ...data, ...stamps })
				.returning({ id: suppliersTable.id })

			const result = takeFirstOrThrow(
				rows,
				'Failed to return supplier data on create',
				'SUPPLIER_CREATE_ERROR',
			)
			await this.clearCache()
			return result
		})
	}

	async handleUpdate(
		id: number,
		data: Omit<SupplierUpdateDto, 'id'>,
		userId: number,
	): Promise<{ id: number }> {
		return record('SupplierService.handleUpdate', async () => {
			const existing = await this.handleDetail(id)

			await checkConflict({
				table: suppliersTable,
				pkColumn: suppliersTable.id,
				fields: [
					{
						field: 'code',
						column: suppliersTable.code,
						message: 'Supplier code already exists',
						code: 'SUPPLIER_CODE_ALREADY_EXISTS',
					},
				],
				input: data,
				existing,
			})

			const stamps = stampUpdate(userId)
			const rows = await db
				.update(suppliersTable)
				.set({ ...data, ...stamps })
				.where(eq(suppliersTable.id, id))
				.returning({ id: suppliersTable.id })

			const result = takeFirstOrThrow(
				rows,
				`Supplier ${id} not found on update`,
				'SUPPLIER_NOT_FOUND',
			)
			await this.clearCache(id)
			return result
		})
	}

	async handleRemove(id: number, userId: number): Promise<{ id: number }> {
		return record('SupplierService.handleRemove', async () => {
			const rows = await db
				.update(suppliersTable)
				.set({ deletedAt: new Date(), deletedBy: userId })
				.where(eq(suppliersTable.id, id))
				.returning({ id: suppliersTable.id })

			const result = takeFirstOrThrow(
				rows,
				`Supplier ${id} not found on remove`,
				'SUPPLIER_NOT_FOUND',
			)
			await this.clearCache(id)
			return result
		})
	}

	private async clearCache(id?: number) {
		const keys = ['list', 'count']
		if (id) keys.push(`${id}`)
		await cache.deleteMany({ keys })
	}
}
