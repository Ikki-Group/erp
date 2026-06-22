import { count, eq, getColumns, or } from 'drizzle-orm'

import { usersTable } from '@/db/schema'

import { takeFirst, type DbContext } from '@/infra/database'

import type { EntityRef } from '@/shared/types/utils'

import type { UserDto, UserWithPasswordDto } from './user.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

type UserInsert = typeof usersTable.$inferInsert
type UserUpdate = PgUpdateSetSource<typeof usersTable>

export class UserRepo {
	constructor(private readonly db: DbContext) {}

	async getList(): Promise<UserDto[]> {
		const { passwordHash: _, ...columns } = getColumns(usersTable)
		return this.db.select(columns).from(usersTable).orderBy(usersTable.id)
	}

	async getById(id: number): Promise<UserWithPasswordDto | undefined> {
		return this.db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1).then(takeFirst)
	}

	async getByIdentifier(identifier: string): Promise<UserWithPasswordDto | null> {
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

	async insert(data: UserInsert): Promise<EntityRef | undefined> {
		const [res] = await this.db.insert(usersTable).values(data).returning({ id: usersTable.id })
		return res
	}

	async insertMany(items: (typeof usersTable.$inferInsert)[], db: DbContext) {
		return db.insert(usersTable).values(items).onConflictDoNothing()
	}

	async update(id: number, data: UserUpdate): Promise<EntityRef | undefined> {
		const [res] = await this.db
			.update(usersTable)
			.set(data)
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
