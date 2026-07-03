import { and, count, eq, ilike, isNull, or } from 'drizzle-orm'

import { suppliersTable } from '@/db/schema/supplier'

import { paginate, sortBy, takeFirst, type DbClient } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	SupplierCreateDto,
	SupplierDto,
	SupplierFilterDto,
	SupplierUpdateDto,
} from './supplier.contract'

export class SupplierRepo {
	constructor(readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(filter: SupplierFilterDto): Promise<WithPaginationResult<SupplierDto>> {
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
			countQuery: () => this.db.select({ count: count() }).from(suppliersTable).where(where),
		})
	}

	async getById(id: number): Promise<SupplierDto | undefined> {
		return this.db
			.select()
			.from(suppliersTable)
			.where(and(eq(suppliersTable.id, id), isNull(suppliersTable.deletedAt)))
			.limit(1)
			.then(takeFirst)
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: SupplierCreateDto, actorId: ActorId): Promise<EntityRef | undefined> {
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(suppliersTable)
			.values({ ...data, ...metadata })
			.returning({ id: suppliersTable.id })

		return res
	}

	async update(data: SupplierUpdateDto, actorId: ActorId): Promise<EntityRef | undefined> {
		const { id, ...rest } = data
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(suppliersTable)
			.set({ ...rest, ...metadata })
			.where(eq(suppliersTable.id, id))
			.returning({ id: suppliersTable.id })

		return res
	}

	async remove(id: number, actorId: ActorId): Promise<EntityRef | undefined> {
		const [res] = await this.db
			.update(suppliersTable)
			.set({ deletedAt: new Date(), deletedBy: actorId })
			.where(eq(suppliersTable.id, id))
			.returning({ id: suppliersTable.id })

		return res
	}
}
