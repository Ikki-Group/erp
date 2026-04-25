import { record } from '@elysiajs/opentelemetry'

import * as core from '@/core/database'

import { rolesTable } from '@/db/schema'

import * as dto from '../dto/role.dto'
import { RoleErrors } from '../errors'

import type { RoleService } from '../service/role.service'

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

export class RoleUsecases {
	constructor(private roleService: RoleService) {}

	async handleCreate(data: dto.RoleCreateDto, actorId: number): Promise<{ id: number }> {
		return record('RoleUsecases.handleCreate', async () => {
			await core.checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: roleConflictFields,
				input: data,
			})

			const result = await this.roleService.repo.create(data, actorId)
			if (!result) throw RoleErrors.createFailed()

			await this.roleService.clearCache()
			return { id: result }
		})
	}

	async handleUpdate(data: dto.RoleUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('RoleUsecases.handleUpdate', async () => {
			const { id } = data

			const existing = await this.roleService.getById(id)
			if (!existing) throw RoleErrors.notFound(id)

			if (existing.isSystem) throw RoleErrors.updateSystemRole()

			await core.checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: roleConflictFields,
				input: data,
				existing,
			})

			const result = await this.roleService.repo.update(data, actorId)
			if (!result) throw RoleErrors.notFound(id)

			await this.roleService.clearCache(id)
			return { id }
		})
	}

	async handleRemove(id: number): Promise<{ id: number }> {
		return record('RoleUsecases.handleRemove', async () => {
			const existing = await this.roleService.getById(id)
			if (!existing) throw RoleErrors.notFound(id)

			if (existing.isSystem) throw RoleErrors.deleteSystemRole()

			const result = await this.roleService.repo.remove(id)
			if (!result) throw RoleErrors.notFound(id)

			await this.roleService.clearCache(id)
			return { id }
		})
	}

	async handleList(filter: dto.RoleFilterDto): Promise<core.WithPaginationResult<dto.RoleDto>> {
		return record('RoleUsecases.handleList', async () => {
			return this.roleService.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<dto.RoleDto> {
		return record('RoleUsecases.handleDetail', async () => {
			const result = await this.roleService.getById(id)
			if (!result) throw RoleErrors.notFound(id)
			return result
		})
	}
}
