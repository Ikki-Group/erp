import { and, count, eq, exists, or } from 'drizzle-orm'

import type { WithPaginationResult } from '@/core/database/pagination'

import { userAssignmentsTable, usersTable } from '@/db/schema'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
} from '@/infra/database'

import type { ActorId, EntityRef } from '@/types/utils'

import type {
	UserFilterSchema,
	UserSchema,
	UserCreateSchema,
	UserUpdateSchema,
} from './user.schema'

export class UserRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(filter: UserFilterSchema): Promise<WithPaginationResult<UserSchema>> {
		const { q, isActive, isRoot, locationId } = filter
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
			locationId === undefined
				? undefined
				: exists(
						this.db
							.select()
							.from(userAssignmentsTable)
							.where(
								and(
									eq(userAssignmentsTable.userId, usersTable.id),
									eq(userAssignmentsTable.locationId, locationId),
								),
							),
					),
		)

		return paginate<UserSchema>({
			data: ({ limit, offset }) =>
				this.db
					.select()
					.from(usersTable)
					.where(where)
					.orderBy(sortBy(usersTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: this.db.select({ count: count() }).from(usersTable).where(where),
		})
	}

	async getList(): Promise<UserSchema[]> {
		return this.db.select().from(usersTable).orderBy(usersTable.id)
	}

	async getById(id: number): Promise<UserSchema | undefined> {
		return this.db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1).then(takeFirst)
	}

	async getByIdentifier(
		identifier: string,
	): Promise<(UserSchema & { passwordHash: string }) | null> {
		const user = await this.db
			.select()
			.from(usersTable)
			.where(or(eq(usersTable.username, identifier), eq(usersTable.email, identifier)))
			.limit(1)
			.then(takeFirst)

		if (!user) return null
		return user
	}

	async getPasswordHash(id: number): Promise<string | null> {
		const res = await this.db
			.select({ passwordHash: usersTable.passwordHash })
			.from(usersTable)
			.where(eq(usersTable.id, id))
			.limit(1)
			.then(takeFirst)
		return res?.passwordHash ?? null
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(usersTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(
		data: UserCreateSchema & { passwordHash: string },
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const userData = { ...data }
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(usersTable)
			.values({ ...userData, ...metadata })
			.returning({ id: usersTable.id })

		return res
	}

	async update(
		id: number,
		data: UserUpdateSchema & { passwordHash?: string },
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const userData = { ...data }
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(usersTable)
			.set({ ...userData, ...metadata })
			.where(eq(usersTable.id, id))
			.returning({ id: usersTable.id })

		return res
	}

	async updatePassword(
		id: number,
		passwordHash: string,
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(usersTable)
			.set({ passwordHash, ...metadata })
			.where(eq(usersTable.id, id))
			.returning({ id: usersTable.id })

		return res
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		const [res] = await this.db
			.delete(usersTable)
			.where(eq(usersTable.id, id))
			.returning({ id: usersTable.id })

		return res
	}
}
