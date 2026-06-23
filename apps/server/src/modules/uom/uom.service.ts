import { record } from '@elysiajs/opentelemetry'

import { uomsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField } from '@/infra/database'
import { RelationMap } from '@/shared/utils'

import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type { UomDto, UomFilterDto, UomCreateDto, UomUpdateDto } from './uom.contract'
import { UomError } from './uom.internal'
import { UomRepo } from './uom.repo'

const uomConflictFields: ConflictField<{ code: string }>[] = [
	{
		field: 'code',
		column: uomsTable.code,
		message: 'UOM code already exists',
		code: 'UOM_CODE_ALREADY_EXISTS',
	},
]

export class UomService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: UomRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'uom')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getListAll(): Promise<UomDto[]> {
		return record('UomService.getListAll', () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.getList(),
			}),
		)
	}

	async getById(id: number): Promise<UomDto | undefined> {
		return record('UomService.getById', () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.getById(id),
			}),
		)
	}

	async getRelationMap(): Promise<RelationMap<number, UomDto>> {
		return record('UomService.getRelationMap', async () => {
			const items = await this.getListAll()
			return RelationMap.fromArray(items, (u) => u.id)
		})
	}

	async seed(data: { code: string; createdBy: ActorId }[]): Promise<void> {
		return record('UomService.seed', () => this.repo.seed(data))
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: UomFilterDto): Promise<WithPaginationResult<UomDto>> {
		return record('UomService.handleList', () => this.repo.getListPaginated(filter))
	}

	async handleDetail(id: number): Promise<UomDto> {
		return record('UomService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw UomError.notFound(id)
			return result
		})
	}

	async handleCreate(data: UomCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('UomService.handleCreate', async () => {
			await checkConflict({
				table: uomsTable,
				pkColumn: uomsTable.id,
				fields: uomConflictFields,
				input: { code: data.code },
			})

			const result = await this.repo.create({ code: data.code, createdBy: actorId })
			if (!result) throw UomError.createFailed()

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
			return result
		})
	}

	async handleUpdate(data: UomUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('UomService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw UomError.notFound(id)

			await checkConflict({
				table: uomsTable,
				pkColumn: uomsTable.id,
				fields: uomConflictFields,
				input: { code: data.code },
				existing,
			})

			const result = await this.repo.update(id, { code: data.code, updatedBy: actorId })
			if (!result) throw UomError.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])
			return result
		})
	}

	async handleDelete(id: number): Promise<EntityRef> {
		return record('UomService.handleDelete', async () => {
			const existing = await this.getById(id)
			if (!existing) throw UomError.notFound(id)

			const result = await this.repo.remove(id)
			if (!result) throw UomError.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])
			return result
		})
	}
}
