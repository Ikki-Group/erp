import { record } from '@elysiajs/opentelemetry'

import * as core from '@/core/database'
import { RelationMap } from '@/core/utils/relation-map'

import { rolesTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/lib/cache'

import { SYSTEM_ROLES } from '../constants'
import { RoleErrors } from '../errors'
import * as dto from './role.dto'
import { RoleRepo } from './role.repo'

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

export class RoleService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: RoleRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'iam.role', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getList(): Promise<dto.RoleDto[]> {
		return record('RoleService.getList', async () => {
			return this.cache.getOrSet({
				key: 'list',
				factory: () => this.repo.getList(),
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
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.getById(id),
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
			return this.cache.getOrSet({
				key: 'count',
				factory: () => this.repo.count(),
			})
		})
	}

	async seed(data: (dto.RoleCreateDto & { createdBy: number })[]): Promise<void> {
		return record('RoleService.seed', async () => {
			await this.repo.seed(data)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

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

			await this.cache.deleteMany({ keys: ['list', 'count'] })

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

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

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

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

			return { id }
		})
	}
}
