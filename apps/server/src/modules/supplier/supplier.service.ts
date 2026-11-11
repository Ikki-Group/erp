import { suppliers } from '@/db/schema/supplier.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { mutate } from '@/shared/service/mutate.ts'
import type { MutationScope } from '@/shared/service/mutate.ts'
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
	private readonly mutation: MutationScope
	private readonly pricingMutation: MutationScope

	constructor(
		private readonly repo: ISupplierRepo,
		cacheClient: CacheClient,
		private readonly materialService: MaterialService,
		private readonly uomService: UomService,
		deps: SupplierServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'supplier')
		const scope = { uow: deps.uow, audit: deps.audit, module: 'supplier' }
		this.mutation = { ...scope, entity: 'supplier', invalidate: this.cache }
		this.pricingMutation = { ...scope, entity: 'supplier_material' }
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
		return mutate(this.mutation, actor, async (tx) => {
			await checkConflict({
				db: tx,
				table: suppliers,
				pkColumn: suppliers.id,
				fields: uniqueFields,
				input: data,
			})

			const written = await this.repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw SupplierError.createFailed()
			return {
				result: written,
				audit: {
					action: 'create',
					summary: `Created supplier "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name },
				},
			}
		})
	}

	async handleUpdate(data: SupplierUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data
		return mutate(this.mutation, actor, async (tx) => {
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw SupplierError.notFound(id)

			await checkConflict({
				db: tx,
				table: suppliers,
				pkColumn: suppliers.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			const written = await this.repo.update(id, { ...updateData, ...stampUpdate(actor.id) }, tx)
			if (!written) throw SupplierError.updateFailed(id)
			return {
				result: written,
				audit: {
					action: 'update',
					summary: `Updated supplier "${data.name}" (${data.code})`,
					oldValues: { code: existing.code, name: existing.name },
					newValues: { code: data.code, name: data.name },
				},
			}
		})
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		return mutate(this.mutation, actor, async (tx) => {
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw SupplierError.notFound(id)

			const written = await this.repo.remove(id, stampUpdate(actor.id), tx)
			if (!written) throw SupplierError.deleteFailed(id)
			return {
				result: written,
				audit: {
					action: 'delete',
					summary: `Deleted supplier "${existing.name}" (${existing.code})`,
				},
			}
		})
	}

	// ─── Pricing Handlers ───

	async handlePricingList(
		filter: SupplierMaterialFilterDto,
	): Promise<WithPaginationResult<SupplierMaterialDto>> {
		return this.repo.findPricingPage(filter)
	}

	async handlePricingCreate(data: SupplierMaterialCreateDto, actor: Actor): Promise<EntityRef> {
		await this.handleGetById(data.supplierId)
		await this.materialService.handleGetById(data.materialId)
		await this.uomService.handleGetById(data.uomId)

		return mutate(this.pricingMutation, actor, async (tx) => {
			const existing = await this.repo.findPricingByPair(data.supplierId, data.materialId, tx)
			if (existing) throw SupplierError.pricingExists(data.supplierId, data.materialId)

			const written = await this.repo.insertPricing({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw SupplierError.pricingCreateFailed()
			return {
				result: written,
				audit: {
					action: 'create',
					summary: `Created pricing for supplier #${data.supplierId} / material #${data.materialId}`,
					newValues: {
						supplierId: data.supplierId,
						materialId: data.materialId,
						unitPrice: data.unitPrice,
					},
				},
			}
		})
	}

	async handlePricingUpdate(data: SupplierMaterialUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data
		await this.uomService.handleGetById(updateData.uomId)

		return mutate(this.pricingMutation, actor, async (tx) => {
			const existing = await this.repo.findPricingById(id, tx)
			if (!existing) throw SupplierError.pricingNotFound(id)

			const written = await this.repo.updatePricing(
				id,
				{ ...updateData, ...stampUpdate(actor.id) },
				tx,
			)
			if (!written) throw SupplierError.pricingUpdateFailed(id)
			return {
				result: written,
				audit: {
					action: 'update',
					summary: `Updated pricing #${id} for supplier #${existing.supplierId} / material #${existing.materialId}`,
					oldValues: { unitPrice: existing.unitPrice, uomId: existing.uomId },
					newValues: { unitPrice: updateData.unitPrice, uomId: updateData.uomId },
				},
			}
		})
	}

	async handlePricingDelete(id: number, actor: Actor): Promise<EntityRef> {
		return mutate(this.pricingMutation, actor, async (tx) => {
			const existing = await this.repo.findPricingById(id, tx)
			if (!existing) throw SupplierError.pricingNotFound(id)

			const written = await this.repo.removePricing(id, tx)
			if (!written) throw SupplierError.pricingNotFound(id)
			return {
				result: written,
				audit: {
					action: 'delete',
					summary: `Deleted pricing for supplier #${existing.supplierId} / material #${existing.materialId}`,
				},
			}
		})
	}
}
