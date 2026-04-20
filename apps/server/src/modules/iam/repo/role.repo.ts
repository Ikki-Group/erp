import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	stampCreate,
	stampUpdate,
	takeFirst,
	type WithPaginationResult,
} from '@/core/database'

import { db } from '@/db'
import { rolesTable } from '@/db/schema'

import * as dto from '../dto'

export class RoleRepo {
	/* -------------------------------------------------------------------------- */
	/*                                    QUERY                                   */
	/* -------------------------------------------------------------------------- */

	async getList(): Promise<dto.RoleDto[]> {
		return record('RoleRepo.getList', async () => {
			return db.select().from(rolesTable).where(isNull(rolesTable.deletedAt))
		})
	}

	async getListPaginated(filter: dto.RoleFilterDto): Promise<WithPaginationResult<dto.RoleDto>> {
		return record('RoleRepo.getListPaginated', async () => {
			const { q, page, limit } = filter
			const where = and(
				isNull(rolesTable.deletedAt),
				q === undefined ? undefined : searchFilter(rolesTable.name, q),
			)

			return paginate<dto.RoleDto>({
				data: ({ limit: l, offset }) => {
					const rows = db
						.select()
						.from(rolesTable)
						.where(where)
						.orderBy(rolesTable.name)
						.limit(l)
						.offset(offset)
					return rows
				},
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(rolesTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<dto.RoleDto | null> {
		return record('RoleRepo.getById', async () => {
			return db
				.select()
				.from(rolesTable)
				.where(and(eq(rolesTable.id, id), isNull(rolesTable.deletedAt)))
				.limit(1)
				.then(takeFirst)
		})
	}

	async count(): Promise<number> {
		return record('RoleRepo.count', async () => {
			return db
				.select({ val: count() })
				.from(rolesTable)
				.where(isNull(rolesTable.deletedAt))
				.then((rows) => rows[0]?.val ?? 0)
		})
	}

	async seed(data: (dto.RoleCreateDto & { createdBy: number })[]): Promise<void> {
		return record('RoleRepo.seed', async () => {
			for (const d of data) {
				const metadata = stampCreate(d.createdBy)
				await db
					.insert(rolesTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: rolesTable.code,
						targetWhere: isNull(rolesTable.deletedAt),
						set: {
							name: d.name,
							description: d.description,
							permissions: d.permissions,
							isSystem: d.isSystem,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
							deletedAt: null,
						},
					})
			}
		})
	}

	/* -------------------------------------------------------------------------- */
	/*                                  MUTATION                                  */
	/* -------------------------------------------------------------------------- */

	async create(data: dto.RoleCreateDto, actorId: number): Promise<number | undefined> {
		return record('RoleRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await db
				.insert(rolesTable)
				.values({ ...data, ...metadata })
				.returning({ id: rolesTable.id })
			return res?.id
		})
	}

	async update(data: dto.RoleUpdateDto, actorId: number): Promise<number | undefined> {
		return record('RoleRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await db
				.update(rolesTable)
				.set({ ...data, ...metadata })
				.where(eq(rolesTable.id, data.id))
				.returning({ id: rolesTable.id })
			return res?.id
		})
	}

	async remove(id: number, actorId: number): Promise<number | undefined> {
		return record('RoleRepo.remove', async () => {
			const [res] = await db
				.update(rolesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(rolesTable.id, id))
				.returning({ id: rolesTable.id })
			return res?.id
		})
	}

	async hardRemove(id: number): Promise<number | undefined> {
		return record('RoleRepo.hardRemove', async () => {
			const [res] = await db
				.delete(rolesTable)
				.where(eq(rolesTable.id, id))
				.returning({ id: rolesTable.id })
			return res?.id
		})
	}
}
