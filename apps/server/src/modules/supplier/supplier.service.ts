import { suppliers } from '@/db/schema/supplier.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { MaterialService } from '@/modules/material/material.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import type {
	SupplierCreateDto,
	SupplierDto,
	SupplierFilterDto,
	SupplierMaterialCreateDto,
	SupplierMaterialDto,
	SupplierMaterialFilterDto,
	SupplierMaterialUpdateDto,
	SupplierUpdateDto,
} from './supplier.contract.ts'
import { SupplierError, uniqueFields } from './supplier.internal.ts'
import type { ISupplierRepo } from './supplier.repo.ts'

// ─── Service ───

export class SupplierService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ISupplierRepo,
		cacheClient: CacheClient,
		private readonly materialService: MaterialService,
		private readonly uomService: UomService,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'supplier')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<SupplierDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getByIds(ids: number[]): Promise<SupplierDto[]> {
		return this.repo.findByIds(ids)
	}

	// ─── Supplier Handlers ───

	async handleGetById(id: number): Promise<SupplierDto> {
		return assertFound(await this.getById(id), () => SupplierError.notFound(id))
	}

	async handleList(filter: SupplierFilterDto): Promise<WithPaginationResult<SupplierDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: SupplierCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Check conflicts (code unique)
		await checkConflict({
			db: this.repo.db,
			table: suppliers,
			pkColumn: suppliers.id,
			fields: uniqueFields,
			input: data,
		})

		// 2. Insert
		const result = await this.repo.insert({
			...data,
			isActive: data.isActive ? 1 : 0,
			...stampCreate(actorId),
		})
		if (!result) throw SupplierError.createFailed()

		// 3. Invalidate cache
		await this.cache.invalidateStandard()

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'supplier',
			entity: 'supplier',
			entityId: result.id,
			action: 'create',
			summary: `Created supplier "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name },
		})

		return result
	}

	async handleUpdate(data: SupplierUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		await this.handleGetById(id)

		// 2. Check conflicts (exclude self)
		await checkConflict({
			db: this.repo.db,
			table: suppliers,
			pkColumn: suppliers.id,
			fields: uniqueFields,
			input: updateData,
			excludeId: id,
		})

		// 3. Update
		const result = await this.repo.update(id, {
			...updateData,
			isActive: updateData.isActive ? 1 : 0,
			...stampUpdate(actorId),
		})
		if (!result) throw SupplierError.updateFailed(id)

		// 4. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'supplier',
			entity: 'supplier',
			entityId: id,
			action: 'update',
			summary: `Updated supplier "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name },
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Soft-delete
		const result = await this.repo.remove(id, stampUpdate(actorId))
		if (!result) throw SupplierError.deleteFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'supplier',
			entity: 'supplier',
			entityId: id,
			action: 'delete',
			summary: `Deleted supplier "${existing.name}" (${existing.code})`,
		})

		return result
	}

	// ─── Pricing Handlers ───

	async handlePricingList(filter: SupplierMaterialFilterDto): Promise<WithPaginationResult<SupplierMaterialDto>> {
		return this.repo.findPricingPage(filter)
	}

	async handlePricingCreate(data: SupplierMaterialCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate supplier exists
		await this.handleGetById(data.supplierId)

		// 2. Validate material exists
		await this.materialService.handleGetById(data.materialId)

		// 3. Validate UoM exists
		await this.uomService.handleGetById(data.uomId)

		// 4. Check unique (supplier, material) pair
		const existing = await this.repo.findPricingByPair(data.supplierId, data.materialId)
		if (existing) {
			throw SupplierError.pricingExists(data.supplierId, data.materialId)
		}

		// 5. Insert
		const result = await this.repo.insertPricing({
			...data,
			...stampCreate(actorId),
		})
		if (!result) throw SupplierError.pricingCreateFailed()

		// 6. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'supplier',
			entity: 'supplier_material',
			entityId: result.id,
			action: 'create',
			summary: `Created pricing for supplier #${data.supplierId} / material #${data.materialId}`,
			newValues: { supplierId: data.supplierId, materialId: data.materialId, unitPrice: data.unitPrice },
		})

		return result
	}

	async handlePricingUpdate(data: SupplierMaterialUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify pricing exists
		const existing = await this.repo.findPricingById(id)
		if (!existing) throw SupplierError.pricingNotFound(id)

		// 2. Validate UoM exists
		await this.uomService.handleGetById(updateData.uomId)

		// 3. Update
		const result = await this.repo.updatePricing(id, {
			...updateData,
			...stampUpdate(actorId),
		})
		if (!result) throw SupplierError.pricingUpdateFailed(id)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'supplier',
			entity: 'supplier_material',
			entityId: id,
			action: 'update',
			summary: `Updated pricing #${id} for supplier #${existing.supplierId} / material #${existing.materialId}`,
			newValues: { unitPrice: updateData.unitPrice, uomId: updateData.uomId },
		})

		return result
	}

	async handlePricingDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify pricing exists
		const existing = await this.repo.findPricingById(id)
		if (!existing) throw SupplierError.pricingNotFound(id)

		// 2. Hard delete
		const result = await this.repo.removePricing(id)
		if (!result) throw SupplierError.pricingNotFound(id)

		// 3. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'supplier',
			entity: 'supplier_material',
			entityId: id,
			action: 'delete',
			summary: `Deleted pricing for supplier #${existing.supplierId} / material #${existing.materialId}`,
		})

		return result
	}
}
