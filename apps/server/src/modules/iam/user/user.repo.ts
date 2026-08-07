import { count, eq, getColumns, or } from 'drizzle-orm'

import { usersTable } from '@/db/schema'

import { takeFirst, type DbContext } from '@/infra/database'
import type { EntityRef } from '@/shared/types/utils'

import type { UserDto, UserWithPasswordDto } from './user.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

type UserInsert = typeof usersTable.$inferInsert
type UserUpdate = PgUpdateSetSource<typeof usersTable>

export interface IUserRepo {
	readonly db: DbContext
	getList(db?: DbContext): Promise<UserDto[]>
	getById(id: number, db?: DbContext): Promise<UserWithPasswordDto | undefined>
	getByIdentifier(identifier: string, db?: DbContext): Promise<UserWithPasswordDto | undefined>
	count(db?: DbContext): Promise<number>
	insert(data: UserInsert, db?: DbContext): Promise<EntityRef | undefined>
	insertMany(items: UserInsert[], db?: DbContext): Promise<void>
	update(id: number, data: UserUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class UserRepo implements IUserRepo {
	constructor(readonly db: DbContext) {}

	async getList(db: DbContext = this.db): Promise<UserDto[]> {
		const { passwordHash: _, ...columns } = getColumns(usersTable)
		return db.select(columns).from(usersTable).orderBy(usersTable.id)
	}

	async getById(id: number, db: DbContext = this.db): Promise<UserWithPasswordDto | undefined> {
		return db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1).then(takeFirst)
	}

	async getByIdentifier(
		identifier: string,
		db: DbContext = this.db,
	): Promise<UserWithPasswordDto | undefined> {
		const user = await db
			.select()
			.from(usersTable)
			.where(or(eq(usersTable.username, identifier), eq(usersTable.email, identifier)))
			.limit(1)
			.then(takeFirst)

		if (!user || !user.passwordHash) return undefined
		return {
			...user,
			passwordHash: user.passwordHash,
		}
	}

	async count(db: DbContext = this.db): Promise<number> {
		return db
			.select({ count: count() })
			.from(usersTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async insert(data: UserInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db.insert(usersTable).values(data).returning({ id: usersTable.id })
		return res
	}

	async insertMany(items: UserInsert[], db: DbContext = this.db): Promise<void> {
		await db.insert(usersTable).values(items).onConflictDoNothing()
	}

	async update(
		id: number,
		data: UserUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(usersTable)
			.set(data)
			.where(eq(usersTable.id, id))
			.returning({ id: usersTable.id })

		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(usersTable)
			.where(eq(usersTable.id, id))
			.returning({ id: usersTable.id })

		return res
	}
}
