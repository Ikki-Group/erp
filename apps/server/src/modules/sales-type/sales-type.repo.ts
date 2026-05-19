import { count, eq } from 'drizzle-orm'

import { salesTypesTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, takeFirst, type DbClient } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'

import type { WithPaginationResult } from '@/types/pagination'
import type { ActorId, EntityRef } from '@/types/utils'

import type {
	SalesTypeCreateSchema,
	SalesTypeFilterSchema,
	SalesTypeSchema,
	SalesTypeUpdateSchema,
} from './sales-type.schema'

export class SalesTypeRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<SalesTypeSchema | undefined> {
		const row = await this.db
			.select()
			.from(salesTypesTable)
			.where(eq(salesTypesTable.id, id))
			.limit(1)
			.then(takeFirst)

		if (!row) return undefined

		return {
			id: row.id,
			code: row.code,
			name: row.name,
			isSystem: row.isBuiltIn,
			createdBy: row.createdBy,
			updatedBy: row.updatedBy,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		}
	}

	async getListPaginated(
		filter: SalesTypeFilterSchema,
	): Promise<WithPaginationResult<SalesTypeSchema>> {
		const { q } = filter
		const where = searchFilter(salesTypesTable.name, q)

		return paginate<SalesTypeSchema>({
			data: async ({ limit, offset }) => {
				const rows = await this.db
					.select()
					.from(salesTypesTable)
					.where(where)
					.orderBy(sortBy(salesTypesTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset)

				return rows.map((row) => ({
					id: row.id,
					code: row.code,
					name: row.name,
					isSystem: row.isBuiltIn,
					createdBy: row.createdBy,
					updatedBy: row.updatedBy,
					createdAt: row.createdAt,
					updatedAt: row.updatedAt,
				}))
			},
			pq: filter,
			countQuery: () => this.db.select({ count: count() }).from(salesTypesTable).where(where),
		})
	}

	async getAll(): Promise<SalesTypeSchema[]> {
		const rows = await this.db.select().from(salesTypesTable).orderBy(salesTypesTable.name)
		return rows.map((row) => ({
			id: row.id,
			code: row.code,
			name: row.name,
			isSystem: row.isBuiltIn,
			createdBy: row.createdBy,
			updatedBy: row.updatedBy,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		}))
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async seed(data: (SalesTypeCreateSchema & { id?: number; createdBy: ActorId })[]): Promise<void> {
		for (const d of data) {
			const metadata = stampCreate(d.createdBy)
			const { isSystem, ...rest } = d
			await this.db
				.insert(salesTypesTable)
				.values({ ...rest, isBuiltIn: isSystem, ...metadata })
				.onConflictDoNothing()
		}
	}

	async create(data: SalesTypeCreateSchema, actorId: ActorId): Promise<EntityRef | undefined> {
		const metadata = stampCreate(actorId)
		const { isSystem, ...rest } = data
		const [res] = await this.db
			.insert(salesTypesTable)
			.values({ ...rest, isBuiltIn: isSystem, ...metadata })
			.returning({ id: salesTypesTable.id })

		return res
	}

	async update(
		id: number,
		data: Partial<SalesTypeUpdateSchema>,
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const metadata = stampUpdate(actorId)
		const { isSystem, ...rest } = data
		const [res] = await this.db
			.update(salesTypesTable)
			.set({
				...rest,
				...(isSystem !== undefined ? { isBuiltIn: isSystem } : {}),
				...metadata,
			})
			.where(eq(salesTypesTable.id, id))
			.returning({ id: salesTypesTable.id })

		return res
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		const [res] = await this.db
			.delete(salesTypesTable)
			.where(eq(salesTypesTable.id, id))
			.returning({ id: salesTypesTable.id })

		return res
	}
}
