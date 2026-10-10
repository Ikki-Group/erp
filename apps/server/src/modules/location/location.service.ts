import type { Actor } from '@/shared/auth/actor.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type {
	LocationCreateDto,
	LocationDto,
	LocationFilterDto,
	LocationUpdateDto,
} from '@ikki/contract/location'
import { LocationError } from './location.internal.ts'
import type { LocationRepo } from './location.repo.ts'

interface Deps extends Infra {
	repo: LocationRepo
}

const AUDIT = { module: 'location', entity: 'location' } as const

export class LocationService {
	constructor(private readonly deps: Deps) {}

	getById(id: number): Promise<LocationDto | undefined> {
		return this.deps.repo.findById(id)
	}

	getByIds(ids: number[]): Promise<LocationDto[]> {
		return this.deps.repo.findByIds(ids)
	}

	getAll(): Promise<LocationDto[]> {
		return this.deps.repo.findMany()
	}

	async handleGetById(id: number): Promise<LocationDto> {
		const location = await this.getById(id)
		if (!location) throw LocationError.notFound(id)
		return location
	}

	handleList(filter: LocationFilterDto): Promise<WithPaginationResult<LocationDto>> {
		return this.deps.repo.findPage(filter)
	}

	handleCreate(data: LocationCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			await repo.assertNoConflict(data, undefined, tx)
			const written = await repo.insert(data, tx)
			if (!written) throw LocationError.createFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created location "${data.name}" (${data.code})`,
				newValues: { code: data.code, name: data.name, type: data.type },
			})
			return written
		})
	}

	handleUpdate(data: LocationUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw LocationError.notFound(id)
			if (changes.code !== existing.code) throw LocationError.codeImmutable()
			await repo.assertNoConflict(changes, id, tx)
			const written = await repo.update(id, { ...changes, updatedBy: actor.id }, tx)
			if (!written) throw LocationError.updateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated location "${changes.name}" (${changes.code})`,
				oldValues: { name: existing.name, type: existing.type },
				newValues: { name: changes.name, type: changes.type },
			})
			return written
		})
	}

	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw LocationError.notFound(id)
			if (await repo.holdsStock(id, tx)) throw LocationError.holdsStock(id)
			const written = await repo.remove(id, { updatedBy: actor.id }, tx)
			if (!written) throw LocationError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted location "${existing.name}" (${existing.code})`,
			})
			return written
		})
	}
}
