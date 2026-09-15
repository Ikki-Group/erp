import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
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
		private readonly uow: UnitOfWork,
		private readonly audit: AuditPort,
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

	async handleCreate(data: TableCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate location exists and is store type
		const location = await this.locationService.handleGetById(data.locationId)
		if (location.type !== 'store') {
			throw TableError.notStoreLocation(data.locationId)
		}

		// 2. Check uniqueness, insert, and audit atomically
		const result = await this.uow.run(async (tx) => {
			const existing = await this.repo.findByLocationAndNumber(data.locationId, data.number, tx)
			if (existing) {
				throw TableError.numberExists(data.locationId, data.number)
			}

			const written = await this.repo.insert(
				{
					locationId: data.locationId,
					number: data.number,
					capacity: data.capacity,
					isActive: data.isActive,
				},
				tx,
			)
			if (!written) throw TableError.createFailed()

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'pos-table',
					entity: 'table',
					entityId: written.id,
					action: 'create',
					summary: `Created table "${data.number}" at location #${data.locationId}`,
					newValues: { number: data.number, capacity: data.capacity, locationId: data.locationId },
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard()
		await this.cache.deleteFromKeys([locationCacheKey(data.locationId)])
		return result
	}

	async handleUpdate(data: TableUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		const current = await this.handleGetById(id)

		// 2. Validate location if changed
		if (updateData.locationId !== current.locationId) {
			const location = await this.locationService.handleGetById(updateData.locationId)
			if (location.type !== 'store') {
				throw TableError.notStoreLocation(updateData.locationId)
			}
		}

		// 3. Check uniqueness, update, and audit atomically
		const result = await this.uow.run(async (tx) => {
			if (updateData.number !== current.number || updateData.locationId !== current.locationId) {
				const existing = await this.repo.findByLocationAndNumber(
					updateData.locationId,
					updateData.number,
					tx,
				)
				if (existing && existing.id !== id) {
					throw TableError.numberExists(updateData.locationId, updateData.number)
				}
			}

			const written = await this.repo.update(
				id,
				{
					locationId: updateData.locationId,
					number: updateData.number,
					capacity: updateData.capacity,
					isActive: updateData.isActive,
				},
				tx,
			)
			if (!written) throw TableError.updateFailed(id)

			await this.audit.record(
				auditEntryOf(actor, {
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
				}),
				tx,
			)
			return written
		})

		// 4. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
		await this.cache.deleteFromKeys([locationCacheKey(current.locationId)])
		if (updateData.locationId !== current.locationId) {
			await this.cache.deleteFromKeys([locationCacheKey(updateData.locationId)])
		}
		return result
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Delete and audit atomically
		const result = await this.uow.run(async (tx) => {
			const written = await this.repo.remove(id, tx)
			if (!written) throw TableError.deleteFailed(id)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'pos-table',
					entity: 'table',
					entityId: id,
					action: 'delete',
					summary: `Deleted table "${existing.number}" at location #${existing.locationId}`,
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
		await this.cache.deleteFromKeys([locationCacheKey(existing.locationId)])
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
