import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import type {
	TableCreateDto,
	TableDto,
	TableFilterDto,
	TableStatusEnum,
	TableUpdateDto,
} from './table.contract.ts'
import { TableError } from './table.internal.ts'
import type { ITableRepo } from './table.repo.ts'

// ─── Cache Keys ───

function locationCacheKey(locationId: number): string {
	return `pos-table:location:${locationId}`
}

// ─── Service ───

export class TableService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ITableRepo,
		cacheClient: CacheClient,
		private readonly locationService: LocationService,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'pos-table')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<TableDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getByLocation(locationId: number): Promise<TableDto[]> {
		return this.cache.getOrSet({
			key: locationCacheKey(locationId),
			factory: () => this.repo.findByLocation(locationId),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<TableDto> {
		return assertFound(await this.getById(id), () => TableError.notFound(id))
	}

	async handleList(filter: TableFilterDto): Promise<WithPaginationResult<TableDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: TableCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate location exists and is store type
		const location = await this.locationService.handleGetById(data.locationId)
		if (location.type !== 'store') {
			throw TableError.notStoreLocation(data.locationId)
		}

		// 2. Check number uniqueness within location
		const existing = await this.repo.findByLocationAndNumber(data.locationId, data.number)
		if (existing) {
			throw TableError.numberExists(data.locationId, data.number)
		}

		// 3. Insert
		const result = await this.repo.insert({
			locationId: data.locationId,
			number: data.number,
			capacity: data.capacity,
			isActive: data.isActive,
		})
		if (!result) throw TableError.createFailed()

		// 4. Invalidate cache
		await this.cache.invalidateStandard()
		await this.cache.deleteFromKeys([locationCacheKey(data.locationId)])

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'pos-table',
			entity: 'table',
			entityId: result.id,
			action: 'create',
			summary: `Created table "${data.number}" at location #${data.locationId}`,
			newValues: { number: data.number, capacity: data.capacity, locationId: data.locationId },
		})

		return result
	}

	async handleUpdate(data: TableUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		const current = await this.handleGetById(id)

		// 2. If number or location changed, check uniqueness
		if (updateData.number !== current.number || updateData.locationId !== current.locationId) {
			// Validate new location if changed
			if (updateData.locationId !== current.locationId) {
				const location = await this.locationService.handleGetById(updateData.locationId)
				if (location.type !== 'store') {
					throw TableError.notStoreLocation(updateData.locationId)
				}
			}

			const existing = await this.repo.findByLocationAndNumber(
				updateData.locationId,
				updateData.number,
			)
			if (existing && existing.id !== id) {
				throw TableError.numberExists(updateData.locationId, updateData.number)
			}
		}

		// 3. Update
		const result = await this.repo.update(id, {
			locationId: updateData.locationId,
			number: updateData.number,
			capacity: updateData.capacity,
			isActive: updateData.isActive,
		})
		if (!result) throw TableError.updateFailed(id)

		// 4. Invalidate cache
		await this.cache.invalidateStandard(id)
		await this.cache.deleteFromKeys([locationCacheKey(current.locationId)])
		if (updateData.locationId !== current.locationId) {
			await this.cache.deleteFromKeys([locationCacheKey(updateData.locationId)])
		}

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'pos-table',
			entity: 'table',
			entityId: id,
			action: 'update',
			summary: `Updated table "${updateData.number}" at location #${updateData.locationId}`,
			newValues: {
				number: updateData.number,
				capacity: updateData.capacity,
				locationId: updateData.locationId,
			},
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Soft-delete
		const result = await this.repo.remove(id)
		if (!result) throw TableError.deleteFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)
		await this.cache.deleteFromKeys([locationCacheKey(existing.locationId)])

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'pos-table',
			entity: 'table',
			entityId: id,
			action: 'delete',
			summary: `Deleted table "${existing.number}" at location #${existing.locationId}`,
		})

		return result
	}

	// ─── Status Update (for POS/Order integration) ───

	async updateStatus(id: number, status: TableStatusEnum): Promise<EntityRef> {
		const existing = await this.handleGetById(id)

		const result = await this.repo.updateStatus(id, status)
		if (!result) throw TableError.updateFailed(id)

		// Invalidate cache
		await this.cache.invalidateStandard(id)
		await this.cache.deleteFromKeys([locationCacheKey(existing.locationId)])

		return result
	}
}
