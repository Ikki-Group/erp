import { suppliers } from '@/db/schema/supplier.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
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

export interface SupplierServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
}

export class SupplierService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ISupplierRepo,
		cacheClient: CacheClient,
		private readonly materialService: MaterialService,
		private readonly uomService: UomService,
		private readonly deps: SupplierServiceDeps,
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

	async handleCreate(data: SupplierCreateDto, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Check conflicts (code unique)
			await checkConflict({
				db: tx,
				table: suppliers,
				pkColumn: suppliers.id,
				fields: uniqueFields,
				input: data,
			})

			// 2. Insert
			const written = await this.repo.insert(
				{
					...data,
					isActive: data.isActive,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!written) throw SupplierError.createFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'supplier',
					entity: 'supplier',
					entityId: written.id,
					action: 'create',
					summary: `Created supplier "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name },
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard()
		return result
	}

	async handleUpdate(data: SupplierUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Verify exists
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw SupplierError.notFound(id)

			// 2. Check conflicts (exclude self)
			await checkConflict({
				db: tx,
				table: suppliers,
				pkColumn: suppliers.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			// 3. Update
			const written = await this.repo.update(
				id,
				{
					...updateData,
					isActive: updateData.isActive,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw SupplierError.updateFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'supplier',
					entity: 'supplier',
					entityId: id,
					action: 'update',
					summary: `Updated supplier "${data.name}" (${data.code})`,
					oldValues: { code: existing.code, name: existing.name },
					newValues: { code: data.code, name: data.name },
				}),
				tx,
			)
			return written
		})

		// 4. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
		return result
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Verify exists
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw SupplierError.notFound(id)

			// 2. Soft-delete
			const written = await this.repo.remove(id, stampUpdate(actor.id), tx)
			if (!written) throw SupplierError.deleteFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'supplier',
					entity: 'supplier',
					entityId: id,
					action: 'delete',
					summary: `Deleted supplier "${existing.name}" (${existing.code})`,
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
		return result
	}

	// ─── Pricing Handlers ───

	async handlePricingList(
		filter: SupplierMaterialFilterDto,
	): Promise<WithPaginationResult<SupplierMaterialDto>> {
		return this.repo.findPricingPage(filter)
	}

	async handlePricingCreate(data: SupplierMaterialCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate supplier exists
		await this.handleGetById(data.supplierId)

		// 2. Validate material exists
		await this.materialService.handleGetById(data.materialId)

		// 3. Validate UoM exists
		await this.uomService.handleGetById(data.uomId)

		const result = await this.deps.uow.run(async (tx) => {
			// 4. Check unique (supplier, material) pair
			const existing = await this.repo.findPricingByPair(data.supplierId, data.materialId, tx)
			if (existing) {
				throw SupplierError.pricingExists(data.supplierId, data.materialId)
			}

			// 5. Insert
			const written = await this.repo.insertPricing({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw SupplierError.pricingCreateFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'supplier',
					entity: 'supplier_material',
					entityId: written.id,
					action: 'create',
					summary: `Created pricing for supplier #${data.supplierId} / material #${data.materialId}`,
					newValues: {
						supplierId: data.supplierId,
						materialId: data.materialId,
						unitPrice: data.unitPrice,
					},
				}),
				tx,
			)
			return written
		})

		return result
	}

	async handlePricingUpdate(data: SupplierMaterialUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Validate UoM exists
		await this.uomService.handleGetById(updateData.uomId)

		const result = await this.deps.uow.run(async (tx) => {
			// 2. Verify pricing exists
			const existing = await this.repo.findPricingById(id, tx)
			if (!existing) throw SupplierError.pricingNotFound(id)

			// 3. Update
			const written = await this.repo.updatePricing(
				id,
				{
					...updateData,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw SupplierError.pricingUpdateFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'supplier',
					entity: 'supplier_material',
					entityId: id,
					action: 'update',
					summary: `Updated pricing #${id} for supplier #${existing.supplierId} / material #${existing.materialId}`,
					oldValues: { unitPrice: existing.unitPrice, uomId: existing.uomId },
					newValues: { unitPrice: updateData.unitPrice, uomId: updateData.uomId },
				}),
				tx,
			)
			return written
		})

		return result
	}

	async handlePricingDelete(id: number, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Verify pricing exists
			const existing = await this.repo.findPricingById(id, tx)
			if (!existing) throw SupplierError.pricingNotFound(id)

			// 2. Hard delete
			const written = await this.repo.removePricing(id, tx)
			if (!written) throw SupplierError.pricingNotFound(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'supplier',
					entity: 'supplier_material',
					entityId: id,
					action: 'delete',
					summary: `Deleted pricing for supplier #${existing.supplierId} / material #${existing.materialId}`,
				}),
				tx,
			)
			return written
		})

		return result
	}
}
