import { uoms } from '@/db/schema/uom.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type {
	ConvertRequestDto,
	ConvertResponseDto,
	UomConversionCreateDto,
	UomConversionDto,
	UomCreateDto,
	UomDto,
	UomFilterDto,
	UomUpdateDto,
} from './uom.contract.ts'
import { SYSTEM_UOM_CODES, UomError, uniqueFields } from './uom.internal.ts'
import type { IUomRepo } from './uom.repo.ts'
import { resolveConversion } from './uom.resolver.ts'

// ─── Service ───

export class UomService {
	private readonly cache: CacheService
	private readonly conversionCache: CacheService

	constructor(
		private readonly repo: IUomRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'uom')
		this.conversionCache = CacheService.createWithDefaultKeys(cacheClient, 'uom-conversion')
	}

	// ─── UoM Cached Reads ───

	async getAll(): Promise<UomDto[]> {
		return this.cache.getOrSet({
			key: this.cache.keys.list,
			factory: () => this.repo.findMany(),
		})
	}

	async getById(id: number): Promise<UomDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	// ─── UoM Handlers ───

	async handleGetById(id: number): Promise<UomDto> {
		return assertFound(await this.getById(id), () => UomError.notFound(id))
	}

	async handleList(filter: UomFilterDto): Promise<WithPaginationResult<UomDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: UomCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Check conflicts
		await checkConflict({
			db: this.repo.db,
			table: uoms,
			pkColumn: uoms.id,
			fields: uniqueFields,
			input: data,
		})

		// 2. Insert
		const result = await this.repo.insert({ ...data, ...stampCreate(actorId) })
		if (!result) throw UomError.createFailed()

		// 3. Invalidate cache
		await this.cache.invalidateStandard()

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'uom',
			entity: 'uom',
			entityId: result.id,
			action: 'create',
			summary: `Created UoM "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name, category: data.category },
		})

		return result
	}

	async handleUpdate(data: UomUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Block system UoM update
		if ((SYSTEM_UOM_CODES as readonly string[]).includes(existing.code.toLowerCase())) {
			throw UomError.systemUomImmutable(id)
		}

		// 3. Check conflicts (exclude self)
		await checkConflict({
			db: this.repo.db,
			table: uoms,
			pkColumn: uoms.id,
			fields: uniqueFields,
			input: updateData,
			excludeId: id,
		})

		// 4. Update
		const result = await this.repo.update(id, { ...updateData, ...stampUpdate(actorId) })
		if (!result) throw UomError.updateFailed(id)

		// 5. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 6. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'uom',
			entity: 'uom',
			entityId: id,
			action: 'update',
			summary: `Updated UoM "${data.name}" (${data.code})`,
			oldValues: { code: existing.code, name: existing.name, category: existing.category },
			newValues: { code: data.code, name: data.name, category: data.category },
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Block system UoM deletion
		if ((SYSTEM_UOM_CODES as readonly string[]).includes(existing.code.toLowerCase())) {
			throw UomError.systemUomImmutable(id)
		}

		// 3. Delete
		const result = await this.repo.remove(id)
		if (!result) throw UomError.deleteFailed(id)

		// 4. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'uom',
			entity: 'uom',
			entityId: id,
			action: 'delete',
			summary: `Deleted UoM "${existing.name}" (${existing.code})`,
		})

		return result
	}

	// ─── Conversion Cached Reads ───

	async getAllConversions(): Promise<UomConversionDto[]> {
		return this.conversionCache.getOrSet({
			key: this.conversionCache.keys.list,
			factory: () => this.repo.findAllConversions(),
		})
	}

	// ─── Conversion Handlers ───

	async handleConversionList(): Promise<UomConversionDto[]> {
		return this.getAllConversions()
	}

	async handleConversionCreate(data: UomConversionCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate both UoMs exist
		const fromUom = await this.handleGetById(data.fromUomId)
		const toUom = await this.handleGetById(data.toUomId)

		// 2. Validate same category
		if (fromUom.category !== toUom.category) {
			throw UomError.conversionCategoryMismatch(data.fromUomId, data.toUomId)
		}

		// 3. Insert (unique constraint on from+to handles duplicates at DB level)
		const result = await this.repo.insertConversion({ ...data, ...stampCreate(actorId) })
		if (!result) throw UomError.conversionCreateFailed()

		// 4. Invalidate conversion cache
		await this.conversionCache.invalidateStandard()

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'uom',
			entity: 'uom_conversion',
			entityId: result.id,
			action: 'create',
			summary: `Created conversion ${fromUom.code} → ${toUom.code} (×${data.factor})`,
			newValues: { fromUomId: data.fromUomId, toUomId: data.toUomId, factor: data.factor },
		})

		return result
	}

	async handleConversionRemove(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.repo.findConversionById(id)
		if (!existing) throw UomError.conversionNotFound(id)

		// 2. Delete
		const result = await this.repo.removeConversion(id)
		if (!result) throw UomError.conversionNotFound(id)

		// 3. Invalidate conversion cache
		await this.conversionCache.invalidateStandard()

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'uom',
			entity: 'uom_conversion',
			entityId: id,
			action: 'delete',
			summary: `Deleted conversion #${id} (from=${existing.fromUomId}, to=${existing.toUomId})`,
		})

		return result
	}

	// ─── Convert Handler ───

	async handleConvert(data: ConvertRequestDto): Promise<ConvertResponseDto> {
		// 1. Validate both UoMs exist and get their data
		const fromUom = await this.handleGetById(data.fromUomId)
		const toUom = await this.handleGetById(data.toUomId)

		// 2. Validate same category
		if (fromUom.category !== toUom.category) {
			throw UomError.conversionCategoryMismatch(data.fromUomId, data.toUomId)
		}

		// 3. Get all conversions from cache
		const conversions = await this.getAllConversions()

		// 4. Resolve conversion path
		const resolved = resolveConversion(data.fromUomId, data.toUomId, data.quantity, conversions)
		if (!resolved) {
			throw UomError.noConversionPath(data.fromUomId, data.toUomId)
		}

		return resolved
	}
}
