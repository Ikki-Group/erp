import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, isNull, or } from 'drizzle-orm'

import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { suppliersTable } from '@/db/schema/supplier'

import type {
	SupplierCreateDto,
	SupplierDto,
	SupplierFilterDto,
	SupplierUpdateDto,
} from './supplier.dto'

export class SupplierRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(filter: SupplierFilterDto): Promise<WithPaginationResult<SupplierDto>> {
		return record('SupplierRepo.getListPaginated', async () => {
			const { q, page, limit } = filter

			const searchCondition = q
				? or(ilike(suppliersTable.name, `%${q}%`), ilike(suppliersTable.code, `%${q}%`))
				: undefined

			const where = and(isNull(suppliersTable.deletedAt), searchCondition)

			return paginate<SupplierDto>({
				data: ({ limit: l, offset }) =>
					this.db
						.select()
						.from(suppliersTable)
						.where(where)
						.orderBy(sortBy(suppliersTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(suppliersTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<SupplierDto | undefined> {
		return record('SupplierRepo.getById', async () => {
			return this.db
				.select()
				.from(suppliersTable)
				.where(and(eq(suppliersTable.id, id), isNull(suppliersTable.deletedAt)))
				.limit(1)
				.then(takeFirst)
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: SupplierCreateDto, actorId: number): Promise<number | undefined> {
		return record('SupplierRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(suppliersTable)
				.values({ ...data, ...metadata })
				.returning({ id: suppliersTable.id })

			return res?.id
		})
	}

	async update(data: SupplierUpdateDto, actorId: number): Promise<number | undefined> {
		return record('SupplierRepo.update', async () => {
			const { id, ...rest } = data
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(suppliersTable)
				.set({ ...rest, ...metadata })
				.where(eq(suppliersTable.id, id))
				.returning({ id: suppliersTable.id })

			return res?.id
		})
	}

	async remove(id: number, actorId: number): Promise<number | undefined> {
		return record('SupplierRepo.remove', async () => {
			const [res] = await this.db
				.update(suppliersTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(suppliersTable.id, id))
				.returning({ id: suppliersTable.id })

			return res?.id
		})
	}
}
