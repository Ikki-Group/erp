import { suppliers } from '@/db/schema/supplier.ts'

import { checkConflict } from '@/infra/database/conflict.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { MaterialService } from '@/modules/material/index.ts'
import type { UomService } from '@/modules/uom/index.ts'

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
import type { SupplierRepo } from './supplier.repo.ts'

interface Deps extends Infra {
	repo: SupplierRepo
	material: Pick<MaterialService, 'handleGetById'>
	uom: Pick<UomService, 'handleGetById'>
}

export class SupplierService {
	constructor(private readonly deps: Deps) {}

	// ─── Supplier Handlers ───

	async handleGetById(id: number): Promise<SupplierDto> {
		return assertFound(await this.deps.repo.findById(id), () => SupplierError.notFound(id))
	}

	async handleList(filter: SupplierFilterDto): Promise<WithPaginationResult<SupplierDto>> {
		return this.deps.repo.findPage(filter)
	}

	async handleCreate(data: SupplierCreateDto, actor: Actor): Promise<EntityRef> {
		return this.deps.uow.run(async (tx) => {
			// 1. Check conflicts (code unique)
			await checkConflict({
				db: tx,
				table: suppliers,
				pkColumn: suppliers.id,
				fields: uniqueFields,
				input: data,
			})

			// 2. Insert
			const written = await this.deps.repo.insert(
				{
					...data,
					isActive: data.isActive,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!written) throw SupplierError.createFailed()

			await this.deps.audit.record(tx, actor, {
				module: 'supplier',
				entity: 'supplier',
				entityId: written.id,
				action: 'create',
				summary: `Created supplier "${data.name}" (${data.code})`,
				newValues: { code: data.code, name: data.name },
			})
			return written
		})
	}

	async handleUpdate(data: SupplierUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data
		return this.deps.uow.run(async (tx) => {
			// 1. Verify exists
			const existing = await this.deps.repo.findById(id, tx)
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
			const written = await this.deps.repo.update(
				id,
				{
					...updateData,
					isActive: updateData.isActive,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw SupplierError.updateFailed(id)

			await this.deps.audit.record(tx, actor, {
				module: 'supplier',
				entity: 'supplier',
				entityId: id,
				action: 'update',
				summary: `Updated supplier "${data.name}" (${data.code})`,
				oldValues: { code: existing.code, name: existing.name },
				newValues: { code: data.code, name: data.name },
			})
			return written
		})
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		return this.deps.uow.run(async (tx) => {
			// 1. Verify exists
			const existing = await this.deps.repo.findById(id, tx)
			if (!existing) throw SupplierError.notFound(id)

			// 2. Soft-delete
			const written = await this.deps.repo.remove(id, stampUpdate(actor.id), tx)
			if (!written) throw SupplierError.deleteFailed(id)

			await this.deps.audit.record(tx, actor, {
				module: 'supplier',
				entity: 'supplier',
				entityId: id,
				action: 'delete',
				summary: `Deleted supplier "${existing.name}" (${existing.code})`,
			})
			return written
		})
	}

	// ─── Pricing Handlers ───

	async handlePricingList(
		filter: SupplierMaterialFilterDto,
	): Promise<WithPaginationResult<SupplierMaterialDto>> {
		return this.deps.repo.findPricingPage(filter)
	}

	async handlePricingCreate(data: SupplierMaterialCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate supplier exists
		await this.handleGetById(data.supplierId)

		// 2. Validate material exists
		await this.deps.material.handleGetById(data.materialId)

		// 3. Validate UoM exists
		await this.deps.uom.handleGetById(data.uomId)

		return this.deps.uow.run(async (tx) => {
			// 4. Check unique (supplier, material) pair
			const existing = await this.deps.repo.findPricingByPair(data.supplierId, data.materialId, tx)
			if (existing) {
				throw SupplierError.pricingExists(data.supplierId, data.materialId)
			}

			// 5. Insert
			const written = await this.deps.repo.insertPricing({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw SupplierError.pricingCreateFailed()

			await this.deps.audit.record(tx, actor, {
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
			})
			return written
		})
	}

	async handlePricingUpdate(data: SupplierMaterialUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Validate UoM exists
		await this.deps.uom.handleGetById(updateData.uomId)

		return this.deps.uow.run(async (tx) => {
			// 2. Verify pricing exists
			const existing = await this.deps.repo.findPricingById(id, tx)
			if (!existing) throw SupplierError.pricingNotFound(id)

			// 3. Update
			const written = await this.deps.repo.updatePricing(
				id,
				{
					...updateData,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw SupplierError.pricingUpdateFailed(id)

			await this.deps.audit.record(tx, actor, {
				module: 'supplier',
				entity: 'supplier_material',
				entityId: id,
				action: 'update',
				summary: `Updated pricing #${id} for supplier #${existing.supplierId} / material #${existing.materialId}`,
				oldValues: { unitPrice: existing.unitPrice, uomId: existing.uomId },
				newValues: { unitPrice: updateData.unitPrice, uomId: updateData.uomId },
			})
			return written
		})
	}

	async handlePricingDelete(id: number, actor: Actor): Promise<EntityRef> {
		return this.deps.uow.run(async (tx) => {
			// 1. Verify pricing exists
			const existing = await this.deps.repo.findPricingById(id, tx)
			if (!existing) throw SupplierError.pricingNotFound(id)

			// 2. Hard delete
			const written = await this.deps.repo.removePricing(id, tx)
			if (!written) throw SupplierError.pricingNotFound(id)

			await this.deps.audit.record(tx, actor, {
				module: 'supplier',
				entity: 'supplier_material',
				entityId: id,
				action: 'delete',
				summary: `Deleted pricing for supplier #${existing.supplierId} / material #${existing.materialId}`,
			})
			return written
		})
	}
}
