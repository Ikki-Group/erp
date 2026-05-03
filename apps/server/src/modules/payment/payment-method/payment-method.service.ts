import { record } from '@elysiajs/opentelemetry'

import { checkConflict, type ConflictField, type WithPaginationResult } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import { RelationMap } from '@/core/utils/relation-map'

import { paymentMethodConfigsTable } from '@/db/schema'

import * as dto from './payment-method.dto'
import { PaymentMethodConfigRepo } from './payment-method.repo'
import type { RecordId } from '@/lib/validation'

const uniqueFields: ConflictField<'name'>[] = [
	{
		field: 'name',
		column: paymentMethodConfigsTable.name,
		message: 'Payment method name already exists',
		code: 'PAYMENT_METHOD_NAME_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) =>
		new NotFoundError(
			`Payment method config with ID ${id} not found`,
			'PAYMENT_METHOD_CONFIG_NOT_FOUND',
		),
	createFailed: () =>
		new InternalServerError(
			'Payment method config creation failed',
			'PAYMENT_METHOD_CONFIG_CREATE_FAILED',
		),
}

export class PaymentMethodConfigService {
	constructor(private readonly repo: PaymentMethodConfigRepo) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getList(): Promise<dto.PaymentMethodConfigDto[]> {
		return record('PaymentMethodConfigService.getList', async () => {
			return this.repo.getList()
		})
	}

	async getEnabled(): Promise<dto.PaymentMethodConfigDto[]> {
		return record('PaymentMethodConfigService.getEnabled', async () => {
			return this.repo.getEnabled()
		})
	}

	async getRelationMap(): Promise<RelationMap<number, dto.PaymentMethodConfigDto>> {
		return record('PaymentMethodConfigService.getRelationMap', async () => {
			const configs = await this.getList()
			return RelationMap.fromArray(configs, (c) => c.id)
		})
	}

	async getById(id: number): Promise<dto.PaymentMethodConfigDto | undefined> {
		return record('PaymentMethodConfigService.getById', async () => {
			return this.repo.getById(id)
		})
	}

	async count(): Promise<number> {
		return record('PaymentMethodConfigService.count', async () => {
			return this.repo.count()
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.PaymentMethodConfigFilterDto,
	): Promise<WithPaginationResult<dto.PaymentMethodConfigDto>> {
		return record('PaymentMethodConfigService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<dto.PaymentMethodConfigDto> {
		return record('PaymentMethodConfigService.handleDetail', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: dto.PaymentMethodConfigCreateDto, actorId: number): Promise<RecordId> {
		return record('PaymentMethodConfigService.handleCreate', async () => {
			await checkConflict({
				table: paymentMethodConfigsTable,
				pkColumn: paymentMethodConfigsTable.id,
				fields: uniqueFields,
				input: data,
			})
			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			return { id: result }
		})
	}

	async handleUpdate(data: dto.PaymentMethodConfigUpdateDto, actorId: number): Promise<RecordId> {
		return record('PaymentMethodConfigService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
				table: paymentMethodConfigsTable,
				pkColumn: paymentMethodConfigsTable.id,
				fields: uniqueFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)

			return { id }
		})
	}

	async handleRemove(id: number): Promise<RecordId> {
		return record('PaymentMethodConfigService.handleRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)
			return { id }
		})
	}

	async seed(data: (dto.PaymentMethodConfigCreateDto & { createdBy: number })[]): Promise<void> {
		return record('PaymentMethodConfigService.seed', async () => {
			await this.repo.seed(data)
		})
	}

	async seedDefault(actorId: number): Promise<void> {
		return record('PaymentMethodConfigService.seedDefault', async () => {
			const defaultPaymentMethods: (dto.PaymentMethodConfigCreateDto & { createdBy: number })[] = [
				{
					type: 'cash',
					category: 'cash',
					name: 'Tunai',
					isEnabled: true,
					isDefault: true,
					createdBy: actorId,
				},
				{
					type: 'bank_transfer',
					category: 'cashless',
					name: 'BCA',
					isEnabled: true,
					isDefault: false,
					createdBy: actorId,
				},
				{
					type: 'bank_transfer',
					category: 'cashless',
					name: 'BNI',
					isEnabled: true,
					isDefault: false,
					createdBy: actorId,
				},
				{
					type: 'e_wallet',
					category: 'cashless',
					name: 'QRIS',
					isEnabled: true,
					isDefault: false,
					createdBy: actorId,
				},
				{
					type: 'e_wallet',
					category: 'cashless',
					name: 'QRIS Mandiri',
					isEnabled: true,
					isDefault: false,
					createdBy: actorId,
				},
			]
			await this.seed(defaultPaymentMethods)
		})
	}
}
