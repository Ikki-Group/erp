import { record } from '@elysiajs/opentelemetry'

import { rolesTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { assertFound, checkConflict, defineConflictFields, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'
import { RelationMap } from '@/shared/utils'

import { SYSTEM_ROLE_CODES } from '../constants'
import type { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from './role.contract'
import { RoleError } from './role.internal'
import type { IRoleRepo } from './role.repo'

const roleConflictFields = defineConflictFields<RoleCreateDto>()([
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
])

export class RoleService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IRoleRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'iam.role')
	}

	toRelationMap(roles: RoleDto[]): RelationMap<number, RoleDto> {
		return RelationMap.fromArray(roles, (x) => x.id)
	}

	async getAll(): Promise<RoleDto[]> {
		return record('RoleService.getAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.findMany(),
			}),
		)
	}

	async count(): Promise<number> {
		return record('RoleService.count', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.count,
				factory: () => this.repo.count(),
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

	async getOwnerRole(): Promise<RoleDto> {
		return record('RoleService.getOwnerRole', async () => {
			const all = await this.getAll()
			const owner = all.find((r) => r.code === SYSTEM_ROLE_CODES.OWNER)
			if (!owner) throw RoleError.notFound(0)
			return owner
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
		return record('RoleService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<RoleDto> {
		return record('RoleService.handleGetById', async () =>
			assertFound(await this.getById(id), () => RoleError.notFound(id)),
		)
	}

	async handleCreate(data: RoleCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('RoleService.handleCreate', async () => {
			await checkConflict({
				db: this.repo.db,
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

			await this.cache.invalidateStandard()
			return result
		})
	}

	async handleUpdate(data: RoleUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('RoleService.handleUpdate', async () => {
			const { id } = data

			const existing = assertFound(await this.repo.findById(id), () => RoleError.notFound(id))
			if (existing.isSystem) throw RoleError.updateSystemRole()

			await checkConflict({
				db: this.repo.db,
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: roleConflictFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(id, { ...data, ...stampUpdate(actorId) })
			if (!result) throw RoleError.notFound(id)

			await this.cache.invalidateStandard(id)
			return result
		})
	}

	async handleDelete(id: number): Promise<EntityRef> {
		return record('RoleService.handleDelete', async () => {
			const existing = assertFound(await this.repo.findById(id), () => RoleError.notFound(id))
			if (existing.isSystem) throw RoleError.deleteSystemRole()

			const result = await this.repo.remove(id)
			if (!result) throw RoleError.notFound(id)

			await this.cache.invalidateStandard(id)
			return result
		})
	}
}
