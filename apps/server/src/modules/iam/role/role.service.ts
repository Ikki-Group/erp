import { record } from '@elysiajs/opentelemetry'

import { rolesTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import { InternalServerError, NotFoundError, BadRequestError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/types/pagination'
import type { ActorId, EntityRef } from '@/types/utils'

import type {
	RoleCreateDto,
	RoleDto,
	RoleFilterSchema,
	RoleUpdateDto,
} from '@/modules/iam/role/role.contract'

import { SYSTEM_ROLES } from '../constants'
import { RoleRepo } from './role.repo'

const roleConflictFields: ConflictField<{ code: string; name: string }>[] = [
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
	notFound: (id: number) =>
		new NotFoundError('Role not found', { code: 'ROLE_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Role creation failed', { code: 'ROLE_CREATE_FAILED' }),
	updateSystemRole: () =>
		new BadRequestError('Cannot update system role', {
			code: 'ROLE_UPDATE_SYSTEM_ROLE_FORBIDDEN',
		}),
	deleteSystemRole: () =>
		new BadRequestError('Cannot delete system role', {
			code: 'ROLE_DELETE_SYSTEM_ROLE_FORBIDDEN',
		}),
}

export class RoleService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: RoleRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'iam.role')
	}

	async getAll(): Promise<RoleDto[]> {
		return record('RoleService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.findMany(),
			}),
		)
	}

	async getById(id: number): Promise<RoleDto | undefined> {
		return record('RoleService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async getSuperadmin(): Promise<RoleDto> {
		return record('RoleService.getSuperadmin', async () => {
			const result = await this.getById(SYSTEM_ROLES.SUPERADMIN_ID)
			if (!result) throw err.notFound(SYSTEM_ROLES.SUPERADMIN_ID)
			return result
		})
	}

	// async seed(data: (RoleMutationSchema & { createdBy: ActorId })[]): Promise<void> {
	// 	return record('RoleService.seed', async () => {
	// 		for (const d of data) {
	// 			const existing = await this.getByIdentifier(d.code)
	// 			if (existing) continue

	// 			await this.create(d, d.createdBy)
	// 		}
	// 	})
	// }

	/* --------------------------------- HANDLE --------------------------------- */

	async handleList(filter: RoleFilterSchema): Promise<WithPaginationResult<RoleDto>> {
		return record('RoleService.handleList', async () => {
			const result = await this.repo.findPage(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<RoleDto> {
		return record('RoleService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: RoleCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('RoleService.handleCreate', async () => {
			await checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: roleConflictFields,
				input: data,
			})

			const result = await this.repo.create({
				...data,
				...stampCreate(actorId),
			})
			if (!result) throw err.createFailed()

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
			return result
		})
	}

	async handleUpdate(data: RoleUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('RoleService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.repo.findById(id)
			if (!existing) throw err.notFound(id)
			if (existing.isSystem) throw err.updateSystemRole()

			await checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: roleConflictFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(id, { ...data, ...stampUpdate(actorId) })
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.byId(id)])
			return result
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('RoleService.handleRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}
}
