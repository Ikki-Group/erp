import { record } from '@elysiajs/opentelemetry'

import { rolesTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import { RelationMap } from '@/shared/utils'

import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	RoleCreateDto,
	RoleDto,
	RoleFilterDto,
	RoleUpdateDto,
} from '@/modules/iam/role/role.contract'

import { SYSTEM_ROLES } from '../constants'
import { RoleError } from './role.internal'
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

export class RoleService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: RoleRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'iam.role')
	}

	toRelationMap(roles: RoleDto[]): RelationMap<number, RoleDto> {
		return RelationMap.fromArray(roles, (x) => x.id)
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
			if (!result) throw RoleError.notFound(SYSTEM_ROLES.SUPERADMIN_ID)
			return result
		})
	}

	async seed(data: (RoleCreateDto & { createdBy: ActorId })[], db: DbContext): Promise<void> {
		return record('RoleService.seed', async () => {
			return this.repo.insertMany(
				data.map((i) => ({
					...i,
					...stampCreate(i.createdBy),
				})),
				db,
			)
		})
	}

	/* --------------------------------- HANDLE --------------------------------- */

	async handleList(filter: RoleFilterDto): Promise<WithPaginationResult<RoleDto>> {
		return record('RoleService.handleList', async () => {
			const result = await this.repo.findPage(filter)
			return result
		})
	}

	async handleGetById(id: number): Promise<RoleDto> {
		return record('RoleService.handleGetById', async () => {
			const result = await this.getById(id)
			if (!result) throw RoleError.notFound(id)
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

			const result = await this.repo.insert({
				...data,
				...stampCreate(actorId),
			})
			if (!result) throw RoleError.createFailed()

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
			return result
		})
	}

	async handleUpdate(data: RoleUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('RoleService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.repo.findById(id)
			if (!existing) throw RoleError.notFound(id)
			if (existing.isSystem) throw RoleError.updateSystemRole()

			await checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: roleConflictFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(id, { ...data, ...stampUpdate(actorId) })
			if (!result) throw RoleError.notFound(id)

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.byId(id)])
			return result
		})
	}

	async handleDelete(id: number): Promise<EntityRef> {
		return record('RoleService.handleDelete', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw RoleError.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}
}
