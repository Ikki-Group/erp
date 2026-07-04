import { record } from '@elysiajs/opentelemetry'

import { paymentMethodsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'
import { RelationMap } from '@/shared/utils'

import type {
	PaymentMethodCreateDto,
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodUpdateDto,
} from './payment-method.contract'
import { PaymentMethodError } from './payment-method.internal'
import type { IPaymentMethodRepo } from './payment-method.repo'

const uniqueFields: ConflictField<{ name: string }>[] = [
	{
		field: 'name',
		column: paymentMethodsTable.name,
		message: 'Payment method name already exists',
		code: 'PAYMENT_METHOD_NAME_ALREADY_EXISTS',
	},
]

export class PaymentMethodService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IPaymentMethodRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'payment-method')
	}

	toRelationMap(items: PaymentMethodDto[]): RelationMap<number, PaymentMethodDto> {
		return RelationMap.fromArray(items, (v) => v.id)
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count, 'global']
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	/* --------------------------------- READ ---------------------------------- */

	async getListAll(): Promise<PaymentMethodDto[]> {
		return record('PaymentMethodService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.findMany(),
			}),
		)
	}

	async getEnabled(): Promise<PaymentMethodDto[]> {
		return record('PaymentMethodService.getEnabled', async () =>
			this.repo.findEnabled(),
		)
	}

	async getGlobal(): Promise<PaymentMethodDto[]> {
		return record('PaymentMethodService.getGlobal', async () =>
			this.cache.getOrSet({
				key: 'global',
				factory: () => this.repo.findGlobal(),
			}),
		)
	}

	async getById(id: number): Promise<PaymentMethodDto | undefined> {
		return record('PaymentMethodService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async count(): Promise<number> {
		return record('PaymentMethodService.count', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.count,
				factory: () => this.repo.count(),
			}),
		)
	}

	/* -------------------------------- MUTATE ---------------------------------- */

	async seed(
		data: (PaymentMethodCreateDto & { createdBy: number })[],
		db: DbContext,
	): Promise<void> {
		return this.repo.seed(
			data.map((x) => {
				const stamps = stampCreate(x.createdBy)
				return {
					type: x.type,
					category: x.category,
					name: x.name,
					isEnabled: x.isEnabled ?? true,
					isDefault: x.isDefault ?? false,
					isGlobal: x.isGlobal ?? false,
					paymentProviderId: x.paymentProviderId ?? null,
					...stamps,
				}
			}),
			db,
		)
	}

	async create(data: PaymentMethodCreateDto, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			db: this.repo.db,
			table: paymentMethodsTable,
			pkColumn: paymentMethodsTable.id,
			fields: uniqueFields,
			input: data,
		})

		const result = await this.repo.insert({
			...data,
			...stampCreate(actorId),
		})
		if (!result) throw PaymentMethodError.createFailed()

		await this.invalidate()
		return result
	}

	async update(data: PaymentMethodUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = await this.getById(id)
		if (!existing) throw PaymentMethodError.notFound(id)

		await checkConflict({
			db: this.repo.db,
			table: paymentMethodsTable,
			pkColumn: paymentMethodsTable.id,
			fields: uniqueFields,
			input: data,
			existing,
		})

		const result = await this.repo.update(id, {
			...data,
			...stampUpdate(actorId),
		})
		if (!result) throw PaymentMethodError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async remove(id: number): Promise<EntityRef> {
		const result = await this.repo.remove(id)
		if (!result) throw PaymentMethodError.notFound(id)

		await this.invalidate(id)
		return result
	}

	/* --------------------------------- HANDLE --------------------------------- */

	async handleList(filter: PaymentMethodFilterDto): Promise<WithPaginationResult<PaymentMethodDto>> {
		return record('PaymentMethodService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<PaymentMethodDto> {
		return record('PaymentMethodService.handleGetById', async () => {
			const result = await this.getById(id)
			if (!result) throw PaymentMethodError.notFound(id)
			return result
		})
	}

	async handleGetEnabled(): Promise<PaymentMethodDto[]> {
		return record('PaymentMethodService.handleGetEnabled', async () => this.getEnabled())
	}

	async handleGetGlobal(): Promise<PaymentMethodDto[]> {
		return record('PaymentMethodService.handleGetGlobal', async () => this.getGlobal())
	}

	async handleCreate(data: PaymentMethodCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('PaymentMethodService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: PaymentMethodUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('PaymentMethodService.handleUpdate', async () => this.update(data, actorId))
	}

	async handleDelete(id: number): Promise<EntityRef> {
		return record('PaymentMethodService.handleDelete', async () => this.remove(id))
	}

	async handleSeedDefault(actorId: number): Promise<void> {
		return record('PaymentMethodService.handleSeedDefault', async () => {
			const defaultPaymentMethods: (PaymentMethodCreateDto & { createdBy: number })[] = [
				{
					type: 'cash',
					category: 'cash',
					name: 'Tunai',
					isEnabled: true,
					isDefault: true,
					isGlobal: true,
					paymentProviderId: null,
					createdBy: actorId,
				},
				{
					type: 'e_wallet',
					category: 'cashless',
					name: 'QRIS BCA',
					isEnabled: true,
					isDefault: false,
					isGlobal: true,
					paymentProviderId: null,
					createdBy: actorId,
				},
				{
					type: 'e_wallet',
					category: 'cashless',
					name: 'QRIS Mandiri',
					isEnabled: true,
					isDefault: false,
					isGlobal: true,
					paymentProviderId: null,
					createdBy: actorId,
				},
				{
					type: 'debit_card',
					category: 'cashless',
					name: 'EDC BCA',
					isEnabled: true,
					isDefault: false,
					isGlobal: false,
					paymentProviderId: null,
					createdBy: actorId,
				},
			]
			await this.seed(defaultPaymentMethods, this.repo.db)
			await this.invalidate()
		})
	}
}
