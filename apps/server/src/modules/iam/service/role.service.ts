import { record } from '@elysiajs/opentelemetry'

import { bento } from '@/core/cache'
import * as core from '@/core/database'
import { RelationMap } from '@/core/utils/relation-map'

import { rolesTable } from '@/db/schema'

import { IAM_CACHE_KEYS, SYSTEM_ROLES } from '../constants'
import * as dto from '../dto/role.dto'
import { RoleErrors } from '../errors'
import { RoleRepo } from '../repo/role.repo'

const cache = bento.namespace('role')

const roleConflictFields: core.ConflictField<'code' | 'name'>[] = [
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

// Role Service
// Handles authorization role definitions and permission sets
// Self-contained domain service — no cross-module dependencies
export class RoleService {
	constructor(private repo = new RoleRepo()) {}

	/* ========================================================================== */
	/*                              QUERY OPERATIONS                             */
	/* ========================================================================== */

	private async clearCache(id?: number) {
		const keys = [IAM_CACHE_KEYS.ROLE_LIST, IAM_CACHE_KEYS.ROLE_COUNT]
		if (id) keys.push(IAM_CACHE_KEYS.ROLE_DETAIL(id))
		await cache.deleteMany({ keys })
	}

	async getList(): Promise<dto.RoleDto[]> {
		return record('RoleService.getList', async () => {
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.ROLE_LIST,
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
				key: IAM_CACHE_KEYS.ROLE_DETAIL(id),
				factory: async ({ skip }) => {
					const result = await this.repo.getById(id)
					return result ?? skip()
				},
			})
		})
	}

	async getSuperadmin(): Promise<dto.RoleDto> {
		return record('RoleService.getSuperadmin', async () => {
			const result = await this.getById(SYSTEM_ROLES.SUPERADMIN_ID)
			if (!result) throw RoleErrors.notFound(SYSTEM_ROLES.SUPERADMIN_ID)
			return result
		})
	}

	async count(): Promise<number> {
		return record('RoleService.count', async () => {
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.ROLE_COUNT,
				factory: async () => this.repo.count(),
			})
		})
	}

	/* ========================================================================== */
	/*                              COMMAND OPERATIONS                           */
	/* ========================================================================== */

	async seed(data: (dto.RoleCreateDto & { createdBy: number })[]): Promise<void> {
		return record('RoleService.seed', async () => {
			await this.repo.seed(data)
			await this.clearCache()
		})
	}

	async handleCreate(data: dto.RoleCreateDto, actorId: number): Promise<{ id: number }> {
		return record('RoleService.handleCreate', async () => {
			await core.checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: roleConflictFields,
				input: data,
			})

			const result = await this.repo.create(data, actorId)
			if (!result) throw RoleErrors.createFailed()

			await this.clearCache()
			return { id: result }
		})
	}

	async handleUpdate(data: dto.RoleUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('RoleService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw RoleErrors.notFound(id)

			if (existing.isSystem) throw RoleErrors.updateSystemRole()

			await core.checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: roleConflictFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(data, actorId)
			if (!result) throw RoleErrors.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	async handleRemove(id: number): Promise<{ id: number }> {
		return record('RoleService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw RoleErrors.notFound(id)

			if (existing.isSystem) throw RoleErrors.deleteSystemRole()

			const result = await this.repo.remove(id)
			if (!result) throw RoleErrors.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	/* ========================================================================== */
	/*                            HANDLER OPERATIONS                             */
	/* ========================================================================== */

	async handleList(filter: dto.RoleFilterDto): Promise<core.WithPaginationResult<dto.RoleDto>> {
		return record('RoleService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<dto.RoleDto> {
		return record('RoleService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw RoleErrors.notFound(id)
			return result
		})
	}
}
