import { record } from '@elysiajs/opentelemetry'
import { count, eq } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { rolesTable } from '@/db/schema'

import * as dto from './role.dto'

export class RoleRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(filter: dto.RoleFilterDto): Promise<WithPaginationResult<dto.RoleDto>> {
		return record('RoleRepo.getListPaginated', async () => {
			const { q, page, limit } = filter
			const where = q === undefined ? undefined : searchFilter(rolesTable.name, q)

			return paginate<dto.RoleDto>({
				data: ({ limit: l, offset }) => {
					const rows = this.db
						.select()
						.from(rolesTable)
						.where(where)
						.orderBy(rolesTable.name)
						.limit(l)
						.offset(offset)
					return rows
				},
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(rolesTable).where(where),
			})
		})
	}

	async getList(): Promise<dto.RoleDto[]> {
		return record('RoleRepo.getList', async () => {
			return this.db.select().from(rolesTable)
		})
	}

	async getById(id: number): Promise<dto.RoleDto | undefined> {
		return record('RoleRepo.getById', async () => {
			return this.db.select().from(rolesTable).where(eq(rolesTable.id, id)).limit(1).then(takeFirst)
		})
	}

	async count(): Promise<number> {
		return record('RoleRepo.count', async () => {
			return this.db
				.select({ count: count() })
				.from(rolesTable)
				.then((rows) => rows[0]?.count ?? 0)
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.RoleCreateDto, actorId: number): Promise<number | undefined> {
		return record('RoleRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(rolesTable)
				.values({ ...data, ...metadata })
				.returning({ id: rolesTable.id })

			return res?.id
		})
	}

	async update(data: dto.RoleUpdateDto, actorId: number): Promise<number | undefined> {
		return record('RoleRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(rolesTable)
				.set({ ...data, ...metadata })
				.where(eq(rolesTable.id, data.id))
				.returning({ id: rolesTable.id })

			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('RoleRepo.remove', async () => {
			const [res] = await this.db
				.delete(rolesTable)
				.where(eq(rolesTable.id, id))
				.returning({ id: rolesTable.id })
			return res?.id
		})
	}

	async seed(data: (dto.RoleCreateDto & { createdBy: number })[]): Promise<void> {
		return record('RoleRepo.seed', async () => {
			for (const d of data) {
				const metadata = stampCreate(d.createdBy)
				await this.db
					.insert(rolesTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: rolesTable.code,
						set: {
							name: d.name,
							description: d.description,
							permissions: d.permissions,
							isSystem: d.isSystem,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
						},
					})
			}
		})
	}
}
