import { and, count, eq, ilike, isNull, or } from 'drizzle-orm'

import { suppliersTable } from '@/db/schema/supplier'

import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/infra/database'

import type { ActorId, EntityRef } from '@/types/utils'

import type {
	SupplierCreateSchema,
	SupplierSchema,
	SupplierFilterSchema,
	SupplierUpdateSchema,
} from './supplier.schema'

export class SupplierRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: SupplierFilterSchema,
	): Promise<WithPaginationResult<SupplierSchema>> {
		const { q, page, limit } = filter

		const searchCondition = q
			? or(ilike(suppliersTable.name, `%${q}%`), ilike(suppliersTable.code, `%${q}%`))
			: undefined

		const where = and(isNull(suppliersTable.deletedAt), searchCondition)

		return paginate<SupplierSchema>({
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
	}

	async getById(id: number): Promise<SupplierSchema | undefined> {
		return this.db
			.select()
			.from(suppliersTable)
			.where(and(eq(suppliersTable.id, id), isNull(suppliersTable.deletedAt)))
			.limit(1)
			.then(takeFirst)
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: SupplierCreateSchema, actorId: ActorId): Promise<EntityRef> {
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(suppliersTable)
			.values({ ...data, ...metadata })
			.returning({ id: suppliersTable.id })

		if (!res) throw new Error('Supplier creation failed')
		return res
	}

	async update(data: SupplierUpdateSchema, actorId: ActorId): Promise<EntityRef> {
		const { id, ...rest } = data
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(suppliersTable)
			.set({ ...rest, ...metadata })
			.where(eq(suppliersTable.id, id))
			.returning({ id: suppliersTable.id })

		if (!res) throw new Error('Supplier update failed')
		return res
	}

	async remove(id: number, actorId: ActorId): Promise<EntityRef> {
		const [res] = await this.db
			.update(suppliersTable)
			.set({ deletedAt: new Date(), deletedBy: actorId })
			.where(eq(suppliersTable.id, id))
			.returning({ id: suppliersTable.id })

		if (!res) throw new Error('Supplier deletion failed')
		return res
	}
}
