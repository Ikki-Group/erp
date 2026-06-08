import { count, eq, or } from 'drizzle-orm'

import { usersTable } from '@/db/schema'

import { takeFirst, type DbClient } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'

import type { ActorId, EntityRef } from '@/types/utils'

import type {
	UserSchema,
	UserCreateSchema,
	UserUpdateSchema,
	UserWithPasswordSchema,
} from './user.schema'

export class UserRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<UserSchema[]> {
		return this.db.select().from(usersTable).orderBy(usersTable.id)
	}

	async getById(id: number): Promise<UserWithPasswordSchema | undefined> {
		return this.db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1).then(takeFirst)
	}

	async getByIdentifier(identifier: string): Promise<UserWithPasswordSchema | null> {
		const user = await this.db
			.select()
			.from(usersTable)
			.where(or(eq(usersTable.username, identifier), eq(usersTable.email, identifier)))
			.limit(1)
			.then(takeFirst)

		if (!user || !user.passwordHash) return null
		return {
			...user,
			passwordHash: user.passwordHash,
		}
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
