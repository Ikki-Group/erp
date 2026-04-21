import { record } from '@elysiajs/opentelemetry'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import * as core from '@/core/database'
import { BadRequestError, InternalServerError, NotFoundError } from '@/core/http/errors'
import { RelationMap } from '@/core/utils/relation-map'

import { rolesTable } from '@/db/schema'

import * as dto from '../dto/role.dto'
import { RoleRepo } from '../repo/role.repo'

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
	private repo = new RoleRepo()

	// internal
	private async clearCache(id?: number) {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await cache.deleteMany({ keys })
	}

	// public
	async getList(): Promise<dto.RoleDto[]> {
		return record('RoleService.getList', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => this.repo.getList(),
			})
		})
	}

	async getRelationMap(): Promise<RelationMap<number, dto.RoleDto>> {
		return record('RoleService.getRelationMap', async () => {
			const roles = await this.getList()
			return RelationMap.fromArray(roles, (r) => r.id)
		})
	}

	async getById(id: number): Promise<dto.RoleDto | undefined> {
		return record('RoleService.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const result = await this.repo.getById(id)
					return result ?? skip()
				},
			})
		})
	}

	async count(): Promise<number> {
		return record('RoleService.count', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
				factory: async () => this.repo.count(),
			})
		})
	}

	// Handler layer
	async handleList(filter: dto.RoleFilterDto): Promise<core.WithPaginationResult<dto.RoleDto>> {
		return record('RoleService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<dto.RoleDto> {
		return record('RoleService.handleDetail', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: dto.RoleCreateDto, actorId: number): Promise<{ id: number }> {
		return record('RoleService.handleCreate', async () => {
			await core.checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: uniqueFields,
				input: data,
			})
			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			await this.clearCache()
			return { id: result }
		})
	}

	async handleUpdate(data: dto.RoleUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('RoleService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)
			await core.checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: uniqueFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('RoleService.handleRemove', async () => {
			const result = await this.repo.remove(id, actorId)
			if (!result) throw err.notFound(id)
			await this.clearCache(id)
			return { id }
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('RoleService.handleHardRemove', async () => {
			const result = await this.repo.hardRemove(id)
			if (!result) throw err.notFound(id)
			await this.clearCache(id)
			return { id }
		})
	}

	async getSuperadmin(): Promise<dto.RoleDto> {
		return record('RoleService.getSuperadmin', async () => {
			const result = await this.getById(1)
			if (!result) throw err.notFound(1)
			return result
		})
	}
}
