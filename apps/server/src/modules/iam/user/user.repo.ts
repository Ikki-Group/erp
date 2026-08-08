import { users } from '@/db/schema/iam.ts'

import {
	allOf,
	eq,
	eqIf,
	inArray,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { UserDto, UserFilterDto } from './user.contract.ts'

// ─── Types ───

type UserInsert = typeof users.$inferInsert
type UserUpdate = Partial<Omit<UserInsert, 'id'>>
type UserRow = typeof users.$inferSelect

/** Maps a raw DB row to the DTO shape (excludes passwordHash). */
function toDto(row: UserRow): UserDto {
	return {
		id: row.id,
		username: row.username,
		email: row.email,
		name: row.name,
		isActive: row.isActive === 1,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface IUserRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<UserDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<UserDto[]>
	findPage(filter: UserFilterDto, db?: DbContext): Promise<WithPaginationResult<UserDto>>
	findByUsername(username: string, db?: DbContext): Promise<UserRow | undefined>
	findByIdRaw(id: number, db?: DbContext): Promise<UserRow | undefined>
	insert(data: UserInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: UserUpdate, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class UserRepo implements IUserRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<UserDto | undefined> {
		const row = await db.select().from(users).where(eq(users.id, id)).limit(1).then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<UserDto[]> {
		if (ids.length === 0) return []
		const rows = await db.select().from(users).where(inArray(users.id, ids))
		return rows.map(toDto)
	}

	async findPage(
		filter: UserFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<UserDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: users.id,
				username: users.username,
				email: users.email,
				name: users.name,
				isActive: users.isActive,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
				createdBy: users.createdBy,
				updatedBy: users.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(users)
			.where(where)
			.orderBy(sql`${users.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => ({
				id: row.id,
				username: row.username,
				email: row.email,
				name: row.name,
				isActive: row.isActive === 1,
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
				createdBy: row.createdBy,
				updatedBy: row.updatedBy,
			})),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	/** Returns full row including passwordHash — for auth/login use only. */
	async findByUsername(username: string, db: DbContext = this.db): Promise<UserRow | undefined> {
		return db.select().from(users).where(eq(users.username, username)).limit(1).then(takeFirst)
	}

	/** Returns full row including passwordHash — for password verification. */
	async findByIdRaw(id: number, db: DbContext = this.db): Promise<UserRow | undefined> {
		return db.select().from(users).where(eq(users.id, id)).limit(1).then(takeFirst)
	}

	async insert(data: UserInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(users).values(data).returning({ id: users.id })
		return result
	}

	async update(
		id: number,
		data: UserUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(users)
			.set(data)
			.where(eq(users.id, id))
			.returning({ id: users.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: UserFilterDto) {
		return allOf(
			searchAcross(filter.q, [users.username, users.email, users.name]),
			eqIf(users.isActive, filter.isActive),
		)
	}
}
