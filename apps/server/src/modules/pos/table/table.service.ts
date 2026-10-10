import type { Db } from '@/infra/database/index.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { LocationService } from '@/modules/location/index.ts'

import type {
	TableCreateDto,
	TableDto,
	TableFilterDto,
	TableStatusEnum,
	TableUpdateDto,
} from '@ikki/contract/pos/table'
import { TableError } from './table.internal.ts'
import type { TableRepo } from './table.repo.ts'

interface Deps extends Infra {
	repo: TableRepo
	location: Pick<LocationService, 'handleGetById'>
}

const AUDIT = { module: 'pos-table', entity: 'table' } as const

export class TableService {
	constructor(private readonly deps: Deps) {}

	async handleGetById(id: number, db?: Db): Promise<TableDto> {
		return assertFound(await this.deps.repo.findById(id, db), () => TableError.notFound(id))
	}

	handleList(filter: TableFilterDto): Promise<WithPaginationResult<TableDto>> {
		return this.deps.repo.findPage(filter)
	}

	async handleCreate(data: TableCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		await this.#assertStore(data.locationId)
		return uow.run(async (tx) => {
			if (await repo.findByLocationAndNumber(data.locationId, data.number, tx)) {
				throw TableError.numberExists(data.locationId, data.number)
			}
			const written = await repo.insert(
				{
					locationId: data.locationId,
					number: data.number,
					capacity: data.capacity,
					isActive: data.isActive,
				},
				tx,
			)
			if (!written) throw TableError.createFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created table "${data.number}" at location #${data.locationId}`,
				newValues: { number: data.number, capacity: data.capacity, locationId: data.locationId },
				locationId: data.locationId,
			})
			return written
		})
	}

	handleUpdate(data: TableUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const current = await this.handleGetById(id, tx)
			if (changes.locationId !== current.locationId) await this.#assertStore(changes.locationId)
			if (changes.number !== current.number || changes.locationId !== current.locationId) {
				const clash = await repo.findByLocationAndNumber(changes.locationId, changes.number, tx)
				if (clash && clash.id !== id) {
					throw TableError.numberExists(changes.locationId, changes.number)
				}
			}
			const written = await repo.update(
				id,
				{
					locationId: changes.locationId,
					number: changes.number,
					capacity: changes.capacity,
					isActive: changes.isActive,
				},
				tx,
			)
			if (!written) throw TableError.updateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated table "${changes.number}" at location #${changes.locationId}`,
				newValues: {
					number: changes.number,
					capacity: changes.capacity,
					locationId: changes.locationId,
				},
				locationId: changes.locationId,
			})
			return written
		})
	}

	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await this.handleGetById(id, tx)
			const written = await repo.remove(id, tx)
			if (!written) throw TableError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted table "${existing.number}" at location #${existing.locationId}`,
				locationId: existing.locationId,
			})
			return written
		})
	}

	/** Order lifecycle side effect; runs inside the order's transaction. */
	async updateStatus(id: number, status: TableStatusEnum, db: Db): Promise<void> {
		const written = await this.deps.repo.updateStatus(id, status, db)
		if (!written) throw TableError.notFound(id)
	}

	async #assertStore(locationId: number): Promise<void> {
		const location = await this.deps.location.handleGetById(locationId)
		if (location.type !== 'store') throw TableError.notStoreLocation(locationId)
	}
}
