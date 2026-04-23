import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, exists, or } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type WithPaginationResult,
} from '@/core/database'

import { db } from '@/db'
import { userAssignmentsTable, usersTable } from '@/db/schema'

import * as dto from '../dto/user.dto'

export class UserRepo {
	/* -------------------------------------------------------------------------- */
	/*                                    QUERY                                   */
	/* -------------------------------------------------------------------------- */

	async getList(): Promise<dto.UserDto[]> {
		return record('UserRepo.getList', async () =>
			db.select().from(usersTable).orderBy(usersTable.fullname),
		)
	}

	async getListPaginated(filter: dto.UserFilterDto): Promise<WithPaginationResult<dto.UserDto>> {
		return record('UserRepo.getListPaginated', async () => {
			const { q, page, limit, isActive, isRoot } = filter
			const where = and(
				q === undefined
					? undefined
					: or(
							searchFilter(usersTable.fullname, q),
							searchFilter(usersTable.username, q),
							searchFilter(usersTable.email, q),
						),
				isActive === undefined ? undefined : eq(usersTable.isActive, isActive),
				isRoot === undefined ? undefined : eq(usersTable.isRoot, isRoot),
				filter.locationId === undefined
					? undefined
					: exists(
							db
								.select()
								.from(userAssignmentsTable)
								.where(
									and(
										eq(userAssignmentsTable.userId, usersTable.id),
										eq(userAssignmentsTable.locationId, filter.locationId),
									),
								),
						),
			)

			return paginate({
				data: ({ limit, offset }) =>
					db
						.select()
						.from(usersTable)
						.where(where)
						.orderBy(sortBy(usersTable.updatedAt, 'desc'))
						.limit(limit)
						.offset(offset),
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(usersTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<dto.UserDto | null> {
		return record('UserRepo.getById', async () => {
			return db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1).then(takeFirst)
		})
	}

	async findByIdentifier(
		identifier: string,
	): Promise<(dto.UserDto & { passwordHash: string }) | null> {
		return record('UserRepo.findByIdentifier', async () => {
			const user = await db
				.select()
				.from(usersTable)
				.where(or(eq(usersTable.username, identifier), eq(usersTable.email, identifier)))
				.limit(1)
				.then(takeFirst)

			if (!user) return null
			return { ...dto.UserDto.parse(user), passwordHash: user.passwordHash }
		})
	}

	async getPasswordHash(id: number): Promise<string | null> {
		return record('UserRepo.getPasswordHash', async () => {
			const res = await db
				.select({ passwordHash: usersTable.passwordHash })
				.from(usersTable)
				.where(eq(usersTable.id, id))
				.limit(1)
				.then(takeFirst)
			return res?.passwordHash ?? null
		})
	}

	async count(): Promise<number> {
		return record('UserRepo.count', async () => {
			return db
				.select({ count: count() })
				.from(usersTable)
				.then((rows) => rows[0]?.count ?? 0)
		})
	}

	/* -------------------------------------------------------------------------- */
	/*                                  MUTATION                                  */
	/* -------------------------------------------------------------------------- */

	async seed(
		data: (dto.UserCreateDto & { passwordHash: string; createdBy: number; isRoot?: boolean })[],
	) {
		return record('UserRepo.seed', async () => {
			const insertedIds: number[] = []
			// oxlint-disable-next-line no-unused-vars
			for (const { assignments, ...d } of data) {
				const metadata = stampCreate(d.createdBy)
				const [inserted] = await db
					.insert(usersTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: usersTable.username,
						set: {
							email: d.email,
							fullname: d.fullname,
							isActive: d.isActive,
							isRoot: d.isRoot,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
						},
					})
					.returning({ id: usersTable.id })

				if (inserted) insertedIds.push(inserted.id)
			}
			return insertedIds
		})
	}

	async create(
		data: dto.UserCreateDto & { passwordHash: string },
		actorId: number,
	): Promise<number | undefined> {
		return record('UserRepo.create', async () => {
			// oxlint-disable-next-line no-unused-vars
			const { assignments, ...rest } = data
			const metadata = stampCreate(actorId)
			const [res] = await db
				.insert(usersTable)
				.values({ ...rest, ...metadata })
				.returning({ id: usersTable.id })
			return res?.id
		})
	}

	async update(
		data: dto.UserUpdateDto & { passwordHash?: string },
		actorId: number,
	): Promise<number | undefined> {
		return record('UserRepo.update', async () => {
			// oxlint-disable-next-line no-unused-vars
			const { assignments, ...rest } = data
			const metadata = stampUpdate(actorId)
			const [res] = await db
				.update(usersTable)
				.set({ ...rest, ...metadata })
				.where(eq(usersTable.id, data.id))
				.returning({ id: usersTable.id })
			return res?.id
		})
	}

	async updatePassword(
		id: number,
		passwordHash: string,
		actorId: number,
	): Promise<number | undefined> {
		return record('UserRepo.updatePassword', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await db
				.update(usersTable)
				.set({ passwordHash, ...metadata })
				.where(eq(usersTable.id, id))
				.returning({ id: usersTable.id })
			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('UserRepo.remove', async () => {
			const [res] = await db
				.delete(usersTable)
				.where(eq(usersTable.id, id))
				.returning({ id: usersTable.id })
			return res?.id
		})
	}
}
