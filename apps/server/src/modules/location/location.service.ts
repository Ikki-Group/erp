import { locations } from '@/db/schema/core.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type {
	LocationCreateDto,
	LocationDto,
	LocationFilterDto,
	LocationUpdateDto,
} from './location.contract.ts'
import { LocationError, uniqueFields } from './location.internal.ts'
import type { ILocationRepo } from './location.repo.ts'

// ─── Service ───

export class LocationService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ILocationRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'location')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<LocationDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getAll(): Promise<LocationDto[]> {
		return this.cache.getOrSet({
			key: this.cache.keys.list,
			factory: () => this.repo.findMany(),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<LocationDto> {
		return assertFound(await this.getById(id), () => LocationError.notFound(id))
	}

	async handleList(filter: LocationFilterDto): Promise<WithPaginationResult<LocationDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: LocationCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Check conflicts
		await checkConflict({
			db: this.repo.db,
			table: locations,
			pkColumn: locations.id,
			fields: uniqueFields,
			input: data,
		})

		// 2. Insert
		const result = await this.repo.insert({
			...data,
			isActive: data.isActive,
			...stampCreate(actorId),
		})
		if (!result) throw LocationError.createFailed()

		// 3. Invalidate cache
		await this.cache.invalidateStandard()

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'location',
			entity: 'location',
			entityId: result.id,
			action: 'create',
			summary: `Created location "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name, type: data.type },
		})

		return result
	}

	async handleUpdate(data: LocationUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		await this.handleGetById(id)

		// 2. Check conflicts (exclude self)
		await checkConflict({
			db: this.repo.db,
			table: locations,
			pkColumn: locations.id,
			fields: uniqueFields,
			input: updateData,
			excludeId: id,
		})

		// 3. Update
		const result = await this.repo.update(id, {
			...updateData,
			isActive: updateData.isActive,
			...stampUpdate(actorId),
		})
		if (!result) throw LocationError.updateFailed(id)

		// 4. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'location',
			entity: 'location',
			entityId: id,
			action: 'update',
			summary: `Updated location "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name, type: data.type },
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Soft-delete
		const result = await this.repo.remove(id, stampUpdate(actorId))
		if (!result) throw LocationError.deleteFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'location',
			entity: 'location',
			entityId: id,
			action: 'delete',
			summary: `Deleted location "${existing.name}" (${existing.code})`,
		})

		return result
	}
}
