import { record } from '@elysiajs/opentelemetry'

import { CacheServiceV2, type CacheClient } from '@/core/cache'
import { checkConflict, type ConflictField, type WithPaginationResult } from '@/core/database'
import { RelationMap } from '@/core/utils/relation-map'

import { rolesTable } from '@/db/schema'

import { InternalServerError, NotFoundError, BadRequestError } from '@/shared/errors/http-error'

import type { ActorId, EntityRef } from '@/types/utils'

import { SYSTEM_ROLES } from './constants'
import { RoleRepo } from './role.repo'
import type { RoleSchema, RoleMutationSchema, RoleFilterSchema } from './role.schema'

const roleConflictFields: ConflictField<'code' | 'name'>[] = [
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
		new NotFoundError('Role not found', { code: 'ROLE_NOT_FOUND', meta: { id } }),
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
	private readonly cache: CacheServiceV2

	constructor(
		private readonly repo: RoleRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheServiceV2.createWithDefaultKeys(cacheClient, 'iam.role')
	}

	async getListAll(): Promise<RoleSchema[]> {
		return record('RoleService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.getList(),
			}),
		)
	}

	async getRelationMap(): Promise<RelationMap<number, RoleSchema>> {
		return record('RoleService.getRelationMap', async () =>
			RelationMap.fromArray(await this.getListAll(), (v) => v.id),
		)
	}

	async seed(data: (RoleMutationSchema & { createdBy: ActorId })[]): Promise<void> {
		return record('RoleService.seed', async () => {
			for (const d of data) {
				const existing = await this.getByIdentifier(d.code)
				if (existing) continue

				await this.create(d, d.createdBy)
			}
		})
	}

	async getByIdentifier(code: string): Promise<RoleSchema | undefined> {
		return record('RoleService.getByIdentifier', async () => {
			const list = await this.getListAll()
			return list.find((r) => r.code === code)
		})
	}

	async getById(id: number): Promise<RoleSchema | undefined> {
		return record('RoleService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.getById(id),
			}),
		)
	}

	async getSuperadmin(): Promise<RoleSchema> {
		return record('RoleService.getSuperadmin', async () => {
			const result = await this.getById(SYSTEM_ROLES.SUPERADMIN_ID)
			if (!result) throw err.notFound(SYSTEM_ROLES.SUPERADMIN_ID)
			return result
		})
	}

	async create(data: RoleMutationSchema, actorId: ActorId): Promise<EntityRef> {
		return record('RoleService.create', async () => {
			await checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: roleConflictFields,
				input: data,
			})

			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
			return result
		})
	}

	async update(id: number, data: RoleMutationSchema, actorId: ActorId): Promise<{ id: number }> {
		return record('RoleService.update', async () => {
			const existing = await this.repo.getById(id)
			if (!existing) throw err.notFound(id)
			if (existing.isSystem) throw err.updateSystemRole()

			await checkConflict({
				table: rolesTable,
				pkColumn: rolesTable.id,
				fields: roleConflictFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(id, data, actorId)
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}

	async remove(id: number): Promise<EntityRef> {
		return record('RoleService.remove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)
			if (existing.isSystem) throw err.deleteSystemRole()

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

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: RoleFilterSchema): Promise<WithPaginationResult<RoleSchema>> {
		return record('RoleService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<RoleSchema> {
		return record('RoleService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: RoleMutationSchema, actorId: ActorId): Promise<EntityRef> {
		return record('RoleService.handleCreate', async () => {
			return this.create(data, actorId)
		})
	}

	async handleUpdate(id: number, data: RoleMutationSchema, actorId: ActorId): Promise<EntityRef> {
		return record('RoleService.handleUpdate', async () => {
			return this.update(id, data, actorId)
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('RoleService.handleRemove', async () => {
			return this.remove(id)
		})
	}
}
