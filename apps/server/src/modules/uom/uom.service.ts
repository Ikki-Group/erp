import { uoms } from '@/db/schema/uom.ts'

import { checkConflict } from '@/infra/database/conflict.ts'
import type { Db } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import { resolveConversion } from './uom.calculator.ts'
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
import type { UomRepo } from './uom.repo.ts'

interface Deps extends Infra {
	repo: UomRepo
}

const AUDIT = { module: 'uom', entity: 'uom' } as const
const AUDIT_CONVERSION = { module: 'uom', entity: 'uom_conversion' } as const

function isSystemUom(uom: UomDto): boolean {
	return (SYSTEM_UOM_CODES as readonly string[]).includes(uom.code.toLowerCase())
}

export class UomService {
	constructor(private readonly deps: Deps) {}

	getById(id: number, db?: Db): Promise<UomDto | undefined> {
		return this.deps.repo.findById(id, db)
	}

	async handleGetById(id: number, db?: Db): Promise<UomDto> {
		return assertFound(await this.getById(id, db), () => UomError.notFound(id))
	}

	handleList(filter: UomFilterDto): Promise<WithPaginationResult<UomDto>> {
		return this.deps.repo.findPage(filter)
	}

	handleCreate(data: UomCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: uoms,
				pkColumn: uoms.id,
				fields: uniqueFields,
				input: data,
			})
			const written = await repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw UomError.createFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created UoM "${data.name}" (${data.code})`,
				newValues: { code: data.code, name: data.name, category: data.category },
			})
			return written
		})
	}

	handleUpdate(data: UomUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw UomError.notFound(id)
			if (isSystemUom(existing)) throw UomError.systemUomImmutable(id)
			await checkConflict({
				db: tx,
				table: uoms,
				pkColumn: uoms.id,
				fields: uniqueFields,
				input: changes,
				excludeId: id,
			})
			const written = await repo.update(id, { ...changes, ...stampUpdate(actor.id) }, tx)
			if (!written) throw UomError.updateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated UoM "${data.name}" (${data.code})`,
				oldValues: { code: existing.code, name: existing.name, category: existing.category },
				newValues: { code: data.code, name: data.name, category: data.category },
			})
			return written
		})
	}

	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw UomError.notFound(id)
			if (isSystemUom(existing)) throw UomError.systemUomImmutable(id)
			const written = await repo.remove(id, tx)
			if (!written) throw UomError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted UoM "${existing.name}" (${existing.code})`,
			})
			return written
		})
	}

	// ─── Conversions ───

	getAllConversions(db?: Db): Promise<UomConversionDto[]> {
		return this.deps.repo.findAllConversions(db)
	}

	handleConversionList(): Promise<UomConversionDto[]> {
		return this.getAllConversions()
	}

	handleConversionCreate(data: UomConversionCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const fromUom = await repo.findById(data.fromUomId, tx)
			const toUom = await repo.findById(data.toUomId, tx)
			if (!fromUom) throw UomError.notFound(data.fromUomId)
			if (!toUom) throw UomError.notFound(data.toUomId)
			if (fromUom.category !== toUom.category) {
				throw UomError.conversionCategoryMismatch(data.fromUomId, data.toUomId)
			}
			// Unique (from, to) is enforced by the DB.
			const written = await repo.insertConversion({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw UomError.conversionCreateFailed()
			await audit.record(tx, actor, {
				...AUDIT_CONVERSION,
				entityId: written.id,
				action: 'create',
				summary: `Created conversion ${fromUom.code} → ${toUom.code} (×${data.factor})`,
				newValues: { fromUomId: data.fromUomId, toUomId: data.toUomId, factor: data.factor },
			})
			return written
		})
	}

	handleConversionRemove(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findConversionById(id, tx)
			if (!existing) throw UomError.conversionNotFound(id)
			const written = await repo.removeConversion(id, tx)
			if (!written) throw UomError.conversionNotFound(id)
			await audit.record(tx, actor, {
				...AUDIT_CONVERSION,
				entityId: id,
				action: 'delete',
				summary: `Deleted conversion #${id} (from=${existing.fromUomId}, to=${existing.toUomId})`,
			})
			return written
		})
	}

	async handleConvert(data: ConvertRequestDto): Promise<ConvertResponseDto> {
		const fromUom = await this.handleGetById(data.fromUomId)
		const toUom = await this.handleGetById(data.toUomId)
		if (fromUom.category !== toUom.category) {
			throw UomError.conversionCategoryMismatch(data.fromUomId, data.toUomId)
		}
		const resolved = resolveConversion(
			data.fromUomId,
			data.toUomId,
			Qty.of(data.quantity),
			await this.getAllConversions(),
		)
		if (!resolved) throw UomError.noConversionPath(data.fromUomId, data.toUomId)
		return { result: resolved.result.toNumeric(), path: resolved.path }
	}
}
