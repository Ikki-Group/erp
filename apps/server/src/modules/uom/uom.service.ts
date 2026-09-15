import { uoms } from '@/db/schema/uom.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import { resolveConversion } from './domain/uom.resolver.ts'
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

// ─── Service ───

export interface UomServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
}

export class UomService {
	private readonly cache: CacheService
	private readonly conversionCache: CacheService

	constructor(
		private readonly repo: IUomRepo,
		cacheClient: CacheClient,
		private readonly deps: UomServiceDeps,
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

	async handleCreate(data: UomCreateDto, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: uoms,
				pkColumn: uoms.id,
				fields: uniqueFields,
				input: data,
			})

			const written = await this.repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw UomError.createFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'uom',
					entity: 'uom',
					entityId: written.id,
					action: 'create',
					summary: `Created UoM "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name, category: data.category },
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard()
		return result
	}

	async handleUpdate(data: UomUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data
		const result = await this.deps.uow.run(async (tx) => {
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw UomError.notFound(id)
			if ((SYSTEM_UOM_CODES as readonly string[]).includes(existing.code.toLowerCase())) {
				throw UomError.systemUomImmutable(id)
			}

			await checkConflict({
				db: tx,
				table: uoms,
				pkColumn: uoms.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			const written = await this.repo.update(id, { ...updateData, ...stampUpdate(actor.id) }, tx)
			if (!written) throw UomError.updateFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'uom',
					entity: 'uom',
					entityId: id,
					action: 'update',
					summary: `Updated UoM "${data.name}" (${data.code})`,
					oldValues: { code: existing.code, name: existing.name, category: existing.category },
					newValues: { code: data.code, name: data.name, category: data.category },
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(id)
		return result
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw UomError.notFound(id)
			if ((SYSTEM_UOM_CODES as readonly string[]).includes(existing.code.toLowerCase())) {
				throw UomError.systemUomImmutable(id)
			}

			const written = await this.repo.remove(id, tx)
			if (!written) throw UomError.deleteFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'uom',
					entity: 'uom',
					entityId: id,
					action: 'delete',
					summary: `Deleted UoM "${existing.name}" (${existing.code})`,
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(id)
		return result
	}

	// ─── Conversion Cached Reads ───

	async getAllConversions(db?: DbContext): Promise<UomConversionDto[]> {
		if (db) return this.repo.findAllConversions(db)
		return this.conversionCache.getOrSet({
			key: this.conversionCache.keys.list,
			factory: () => this.repo.findAllConversions(),
		})
	}

	// ─── Conversion Handlers ───

	async handleConversionList(): Promise<UomConversionDto[]> {
		return this.getAllConversions()
	}

	async handleConversionCreate(data: UomConversionCreateDto, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Validate both UoMs exist
			const fromUom = await this.repo.findById(data.fromUomId, tx)
			const toUom = await this.repo.findById(data.toUomId, tx)
			if (!fromUom) throw UomError.notFound(data.fromUomId)
			if (!toUom) throw UomError.notFound(data.toUomId)

			// 2. Validate same category
			if (fromUom.category !== toUom.category) {
				throw UomError.conversionCategoryMismatch(data.fromUomId, data.toUomId)
			}

			// 3. Insert (unique constraint on from+to handles duplicates at DB level)
			const written = await this.repo.insertConversion({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw UomError.conversionCreateFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'uom',
					entity: 'uom_conversion',
					entityId: written.id,
					action: 'create',
					summary: `Created conversion ${fromUom.code} → ${toUom.code} (×${data.factor})`,
					newValues: { fromUomId: data.fromUomId, toUomId: data.toUomId, factor: data.factor },
				}),
				tx,
			)
			return written
		})

		await this.conversionCache.invalidateStandard()
		return result
	}

	async handleConversionRemove(id: number, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Verify exists
			const existing = await this.repo.findConversionById(id, tx)
			if (!existing) throw UomError.conversionNotFound(id)

			// 2. Delete
			const written = await this.repo.removeConversion(id, tx)
			if (!written) throw UomError.conversionNotFound(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'uom',
					entity: 'uom_conversion',
					entityId: id,
					action: 'delete',
					summary: `Deleted conversion #${id} (from=${existing.fromUomId}, to=${existing.toUomId})`,
				}),
				tx,
			)
			return written
		})

		await this.conversionCache.invalidateStandard()
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
		const resolved = resolveConversion(
			data.fromUomId,
			data.toUomId,
			Qty.of(data.quantity),
			conversions,
		)
		if (!resolved) {
			throw UomError.noConversionPath(data.fromUomId, data.toUomId)
		}

		return {
			result: resolved.result.toNumeric(),
			path: resolved.path,
		}
	}
}
