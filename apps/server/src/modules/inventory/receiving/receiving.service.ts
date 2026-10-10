import type { Db } from '@/infra/database/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { LocationService } from '@/modules/location/index.ts'
import type { MaterialAssignmentService, MaterialService } from '@/modules/material/index.ts'
import type { SupplierService } from '@/modules/supplier/index.ts'
import { resolveConversion } from '@/modules/uom/index.ts'
import type { UomConversionDto, UomService } from '@/modules/uom/index.ts'

import type { StockService } from '../stock/stock.service.ts'
import { toBaseUnits } from './receiving.calculator.ts'
import { ReceivingError } from './receiving.internal.ts'
import type { ReceivingRepo } from './receiving.repo.ts'
import type {
	ReceivingConfirmDto,
	ReceivingCreateDto,
	ReceivingDetailDto,
	ReceivingDto,
	ReceivingFilterDto,
	ReceivingUpdateDto,
} from '@ikki/contract/inventory/receiving'

interface Deps extends Infra {
	repo: ReceivingRepo
	stock: Pick<StockService, 'recordMovement'>
	assignment: Pick<MaterialAssignmentService, 'isAssigned'>
	location: Pick<LocationService, 'handleGetById'>
	material: Pick<MaterialService, 'handleGetById'>
	supplier: Pick<SupplierService, 'handleGetById'>
	uom: Pick<UomService, 'getAllConversions'>
}

interface LineInput {
	materialId: number
	uomId: number
}

const AUDIT = { module: 'inventory', entity: 'receiving' } as const

export class ReceivingService {
	constructor(private readonly deps: Deps) {}

	handleList(filter: ReceivingFilterDto): Promise<WithPaginationResult<ReceivingDto>> {
		return this.deps.repo.findPage(filter)
	}

	async handleDetail(id: number): Promise<ReceivingDetailDto> {
		return assertFound(await this.deps.repo.findDetailById(id), () => ReceivingError.notFound(id))
	}

	async handleCreate(data: ReceivingCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, supplier, location } = this.deps
		await supplier.handleGetById(data.supplierId)
		const loc = await location.handleGetById(data.locationId)
		await this.#validateLines(data.lines, data.locationId)

		return uow.run(async (tx) => {
			const receivingNo = await generateNumber({
				prefix: 'RCV',
				locationCode: loc.code,
				locationId: data.locationId,
				database: tx,
			})
			const created = await repo.insert(
				{
					receivingNo,
					locationId: data.locationId,
					supplierId: data.supplierId,
					status: 'draft',
					notes: data.notes ?? null,
					receivedBy: actor.id,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!created) throw ReceivingError.createFailed()
			await repo.insertLines(
				data.lines.map((line) => ({
					receivingId: created.id,
					materialId: line.materialId,
					quantity: line.qty,
					unitCost: line.unitCost,
					uomId: line.uomId,
				})),
				tx,
			)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: created.id,
				action: 'create',
				summary: `Created receiving ${receivingNo} from supplier #${data.supplierId} at location #${data.locationId}`,
				newValues: {
					receivingNo,
					locationId: data.locationId,
					supplierId: data.supplierId,
					lineCount: data.lines.length,
				},
				locationId: data.locationId,
			})
			return created
		})
	}

	async handleUpdate(data: ReceivingUpdateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, supplier } = this.deps
		return uow.run(async (tx) => {
			const receiving = assertFound(await repo.findById(data.receivingId, tx), () =>
				ReceivingError.notFound(data.receivingId),
			)
			if (receiving.status !== 'draft') throw ReceivingError.notDraft(data.receivingId)
			if (data.supplierId) await supplier.handleGetById(data.supplierId)
			if (data.lines) await this.#validateLines(data.lines, receiving.locationId, tx)

			const updated = await repo.update(
				data.receivingId,
				{
					...(data.supplierId ? { supplierId: data.supplierId } : {}),
					...(data.notes === undefined ? {} : { notes: data.notes ?? null }),
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!updated) throw ReceivingError.notFound(data.receivingId)
			if (data.lines) {
				await repo.replaceLines(
					data.receivingId,
					data.lines.map((line) => ({
						receivingId: data.receivingId,
						materialId: line.materialId,
						quantity: line.qty,
						unitCost: line.unitCost,
						uomId: line.uomId,
					})),
					tx,
				)
			}
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: data.receivingId,
				action: 'update',
				summary: `Updated receiving ${receiving.receivingNo}`,
				newValues: { supplierId: data.supplierId, lineCount: data.lines?.length },
				locationId: receiving.locationId,
			})
			return updated
		})
	}

	/** Confirm: every line becomes a `purchase_receipt` in base UoM, all in one transaction. */
	handleConfirm(data: ReceivingConfirmDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, stock, material, uom } = this.deps
		return record('receiving.confirm', () =>
			uow.run(async (tx) => {
				const receiving = assertFound(await repo.findById(data.receivingId, tx), () =>
					ReceivingError.notFound(data.receivingId),
				)
				if (receiving.status === 'confirmed') {
					throw ReceivingError.alreadyConfirmed(data.receivingId)
				}
				if (receiving.status !== 'draft') throw ReceivingError.notDraft(data.receivingId)

				const lines = await repo.findLinesByReceivingId(data.receivingId, tx)
				const conversions = await uom.getAllConversions(tx)
				for (const line of lines) {
					const { baseUomId } = await material.handleGetById(line.materialId, tx)
					const factor = conversionFactor(line.uomId, baseUomId, line.materialId, conversions)
					const base = toBaseUnits(Qty.of(line.quantity), Money.of(line.unitCost), factor)
					await stock.recordMovement(
						{
							materialId: line.materialId,
							locationId: receiving.locationId,
							type: 'purchase_receipt',
							direction: 'in',
							qty: base.qty.toNumeric(),
							unitCost: base.unitCost.toCost(),
							referenceType: 'receiving',
							referenceId: data.receivingId,
							notes: `Receiving: ${receiving.receivingNo}`,
							actorId: actor.id,
						},
						tx,
					)
				}

				const result = await repo.updateStatus(data.receivingId, 'confirmed', actor.id, tx)
				if (!result) throw ReceivingError.notFound(data.receivingId)
				await audit.record(tx, actor, {
					...AUDIT,
					entityId: data.receivingId,
					action: 'confirm',
					summary: `Confirmed receiving ${receiving.receivingNo} (${lines.length} lines)`,
					newValues: { status: 'confirmed', lineCount: lines.length },
					locationId: receiving.locationId,
				})
				return result
			}),
		)
	}

	/** Each line's material must be assigned here and its UoM convertible to base UoM. */
	async #validateLines(lines: LineInput[], locationId: number, db?: Db): Promise<void> {
		const { assignment, material, uom } = this.deps
		const conversions = await uom.getAllConversions(db)
		for (const line of lines) {
			if (!(await assignment.isAssigned(line.materialId, locationId, db))) {
				throw ReceivingError.materialNotAssigned(line.materialId, locationId)
			}
			const { baseUomId } = await material.handleGetById(line.materialId, db)
			conversionFactor(line.uomId, baseUomId, line.materialId, conversions)
		}
	}
}

/** Base units per one `fromUomId` unit. */
function conversionFactor(
	fromUomId: number,
	baseUomId: number,
	materialId: number,
	conversions: UomConversionDto[],
): Qty {
	const resolved = resolveConversion(fromUomId, baseUomId, Qty.of('1'), conversions)
	if (!resolved) throw ReceivingError.uomNotConvertible(materialId, fromUomId, baseUomId)
	return resolved.result
}
