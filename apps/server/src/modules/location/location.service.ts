import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { CachePort } from '@/shared/cache/cache.port.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type {
	LocationCreateDto,
	LocationDto,
	LocationFilterDto,
	LocationUpdateDto,
} from './location.contract.ts'
import { LocationError } from './location.internal.ts'
import type { ILocationRepo } from './location.repo.ts'

export interface LocationServiceDeps {
	repo: ILocationRepo
	uow: UnitOfWork
	cache: CachePort
	audit: AuditPort
}

export type LocationApi = {
	service: LocationService
	getById: LocationService['getById']
	getAll: LocationService['getAll']
	handleGetById: LocationService['handleGetById']
	handleList: LocationService['handleList']
	handleCreate: LocationService['handleCreate']
	handleUpdate: LocationService['handleUpdate']
	handleDelete: LocationService['handleDelete']
} & Record<string, unknown>

export class LocationService {
	constructor(private readonly deps: LocationServiceDeps) {}

	async getById(id: number): Promise<LocationDto | undefined> {
		return this.deps.cache.getOrSetOptional('location', `byId:${id}`, () =>
			this.deps.repo.findById(id),
		)
	}

	async getAll(): Promise<LocationDto[]> {
		return this.deps.cache.getOrSet('location', 'list', () => this.deps.repo.findMany())
	}

	async handleGetById(id: number): Promise<LocationDto> {
		const location = await this.getById(id)
		if (!location) throw LocationError.notFound(id)
		return location
	}

	async handleList(filter: LocationFilterDto): Promise<WithPaginationResult<LocationDto>> {
		return this.deps.repo.findPage(filter)
	}

	async handleCreate(data: LocationCreateDto, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			await this.deps.repo.assertNoConflict(data, undefined, tx)
			const written = await this.deps.repo.insert(data, tx)
			if (!written) throw LocationError.createFailed()
			await this.deps.audit.record(
				{
					actorId: actor.id,
					actorName: actor.name,
					locationId: actor.locationId,
					module: 'location',
					entity: 'location',
					entityId: written.id,
					action: 'create',
					summary: `Created location "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name, type: data.type },
				},
				tx,
			)
			return written
		})
		await this.deps.cache.invalidate('location', result.id)
		return result
	}

	async handleUpdate(data: LocationUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data
		const result = await this.deps.uow.run(async (tx) => {
			const existing = await this.deps.repo.findById(id, tx)
			if (!existing) throw LocationError.notFound(id)
			await this.deps.repo.assertNoConflict(updateData, id, tx)
			const written = await this.deps.repo.update(id, updateData, tx)
			if (!written) throw LocationError.updateFailed(id)
			await this.deps.audit.record(
				{
					actorId: actor.id,
					actorName: actor.name,
					locationId: actor.locationId,
					module: 'location',
					entity: 'location',
					entityId: id,
					action: 'update',
					summary: `Updated location "${data.name}" (${data.code})`,
					oldValues: { code: existing.code, name: existing.name, type: existing.type },
					newValues: { code: data.code, name: data.name, type: data.type },
				},
				tx,
			)
			return written
		})
		await this.deps.cache.invalidate('location', result.id)
		return result
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			const existing = await this.deps.repo.findById(id, tx)
			if (!existing) throw LocationError.notFound(id)
			const written = await this.deps.repo.remove(id, { updatedBy: actor.id }, tx)
			if (!written) throw LocationError.deleteFailed(id)
			await this.deps.audit.record(
				{
					actorId: actor.id,
					actorName: actor.name,
					locationId: actor.locationId,
					module: 'location',
					entity: 'location',
					entityId: id,
					action: 'delete',
					summary: `Deleted location "${existing.name}" (${existing.code})`,
				},
				tx,
			)
			return written
		})
		await this.deps.cache.invalidate('location', result.id)
		return result
	}
}
