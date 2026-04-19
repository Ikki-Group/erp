import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull, or } from 'drizzle-orm'

import { bento } from '@/core/cache'
import * as core from '@/core/database'
import { BadRequestError, InternalServerError, NotFoundError } from '@/core/http/errors'

import { db } from '@/db'
import { rolesTable } from '@/db/schema'

import * as dto from '../dto/role.dto'

const cache = bento.namespace('role')

const uniqueFields: core.ConflictField<'code' | 'name'>[] = [
	{
		field: 'code',
		column: rolesTable.code,
		message: 'Role code already exists',
		code: 'ROLE_CODE_ALREADY_EXISTS',
	},
	{
		field: 'name',
		column: rolesTable.name,
		message: 'Role name already exists',
		code: 'ROLE_NAME_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) => new NotFoundError(`Role with ID ${id} not found`, 'ROLE_NOT_FOUND'),
	createFailed: () => new InternalServerError('Role creation failed', 'ROLE_CREATE_FAILED'),
	updateSystemRoleForbidden: () =>
		new BadRequestError('Cannot update system role', 'ROLE_UPDATE_SYSTEM_ROLE_FORBIDDEN'),
	removeSystemRoleForbidden: () =>
		new BadRequestError('Cannot remove system role', 'ROLE_REMOVE_SYSTEM_ROLE_FORBIDDEN'),
}

// Role Service (Layer 0)
// Handles authorization role definitions and permission sets.
export class RoleService {
	// Seed initial roles.
	async seed(data: (dto.RoleCreateDto & { createdBy: number })[]): Promise<void> {
		await record('RoleService.seed', async () => {
			for (const d of data) {
				const metadata = core.stampCreate(d.createdBy)
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
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
							deletedAt: null,
						},
					})
			}
			await this.clearCache()
		})
	}

	// Returns active roles.
	async find(): Promise<dto.RoleDto[]> {
		return record('RoleService.find', async () => {
			return cache.getOrSet({
				key: 'list',
				factory: async () => {
					const rows = await db
						.select()
						.from(rolesTable)
						.where(isNull(rolesTable.deletedAt))
						.orderBy(rolesTable.name)
					return rows
				},
			})
		})
	}

	// Finds a role by ID.
	async getById(id: number): Promise<dto.RoleDto> {
		return record('RoleService.getById', async () => {
			return cache.getOrSet({
				key: `${id}`,
				factory: async () => {
					const rows = await db
						.select()
						.from(rolesTable)
						.where(and(eq(rolesTable.id, id), isNull(rolesTable.deletedAt)))

					const first = core.takeFirstOrThrow(
						rows,
						`Role with ID ${id} not found`,
						'ROLE_NOT_FOUND',
					)
					return dto.RoleDto.parse(first)
				},
			})
		})
	}

	async getSuperadmin(): Promise<dto.RoleDto> {
		return this.getById(1)
	}

	// Returns total count.
	async count(): Promise<number> {
		return record('RoleService.count', async () => {
			return cache.getOrSet({
				key: 'count',
				factory: async () => {
					const rows = await db
						.select({ val: count() })
						.from(rolesTable)
						.where(isNull(rolesTable.deletedAt))
					return rows[0]?.val ?? 0
				},
			})
		})
	}

	// Paginated list.
	async handleList(filter: dto.RoleFilterDto): Promise<core.WithPaginationResult<dto.RoleDto>> {
		const result = await record('RoleService.handleList', async () => {
			const { q, page, limit } = filter
			const where = and(
				isNull(rolesTable.deletedAt),
				q === undefined
					? undefined
					: or(core.searchFilter(rolesTable.name, q), core.searchFilter(rolesTable.code, q)),
			)

			const p = await core.paginate<dto.RoleDto>({
				data: async ({ limit: l, offset }) => {
					const rows = await db.select().from(rolesTable).where(where).limit(l).offset(offset)
					return rows
				},
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(rolesTable).where(where),
			})
			return p
		})
		return result
	}

	// Resource detail.
	async handleDetail(id: number): Promise<dto.RoleDto> {
		return this.getById(id)
	}

	// Creation.
	async handleCreate(data: dto.RoleCreateDto, actorId: number): Promise<{ id: number }> {
		const result = await record('RoleService.handleCreate', async () => {
			await core.checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: uniqueFields,
				input: data,
			})
			const [inserted] = await db
				.insert(rolesTable)
				.values({ ...data, ...core.stampCreate(actorId) })
				.returning({ id: rolesTable.id })
			if (!inserted) throw err.createFailed()
			await this.clearCache()
			return inserted
		})
		return result
	}

	// Update.
	async handleUpdate(data: dto.RoleUpdateDto, actorId: number): Promise<{ id: number }> {
		const result = await record('RoleService.handleUpdate', async () => {
			const { id, ...rest } = data
			const existing = await this.getById(id)
			if (existing.isSystem) throw err.updateSystemRoleForbidden()

			await core.checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: uniqueFields,
				input: { ...rest },
				existing,
			})

			await db
				.update(rolesTable)
				.set({ ...data, ...core.stampUpdate(actorId) })
				.where(eq(rolesTable.id, id))
			await this.clearCache(id)
			return { id }
		})
		return result
	}

	// Removal.
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('RoleService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (existing.isSystem) throw err.removeSystemRoleForbidden()
			const [result] = await db
				.update(rolesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(rolesTable.id, id))
				.returning({ id: rolesTable.id })
			if (!result) throw err.notFound(id)
			await this.clearCache(id)
			return result
		})
	}

	// Hard Removal.
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('RoleService.handleHardRemove', async () => {
			const existing = await this.getById(id)
			if (existing.isSystem) throw err.removeSystemRoleForbidden()
			const [result] = await db
				.delete(rolesTable)
				.where(eq(rolesTable.id, id))
				.returning({ id: rolesTable.id })
			if (!result) throw err.notFound(id)
			await this.clearCache(id)
			return result
		})
	}

	// Clear relevant caches.
	private async clearCache(id?: number) {
		const keys = ['list', 'count']
		if (id) keys.push(`${id}`)
		await cache.deleteMany({
			keys,
		})
	}
}
