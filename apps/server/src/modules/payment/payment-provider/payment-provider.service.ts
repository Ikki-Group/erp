import { record } from '@elysiajs/opentelemetry'

import { paymentProvidersTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	PaymentProviderCreateDto,
	PaymentProviderDto,
	PaymentProviderFilterDto,
	PaymentProviderUpdateDto,
} from './payment-provider.contract'
import { PaymentProviderError } from './payment-provider.internal'
import type { IPaymentProviderRepo } from './payment-provider.repo'

const uniqueFields: ConflictField<{ code: string }>[] = [
	{
		field: 'code',
		column: paymentProvidersTable.code,
		message: 'Payment provider code already exists',
		code: 'PAYMENT_PROVIDER_CODE_ALREADY_EXISTS',
	},
]

export class PaymentProviderService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IPaymentProviderRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'payment.provider')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	async find(): Promise<PaymentProviderDto[]> {
		return record('PaymentProviderService.find', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.findMany({ isActive: true }),
			}),
		)
	}

	async getById(id: number): Promise<PaymentProviderDto | undefined> {
		return record('PaymentProviderService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async getByCode(code: string): Promise<PaymentProviderDto | undefined> {
		return record('PaymentProviderService.getByCode', async () =>
			this.cache.getOrSetWithSkip({
				key: `byCode:${code}`,
				factory: () => this.repo.findByCode(code),
			}),
		)
	}

	async seed(
		items: Pick<
			PaymentProviderDto,
			'id' | 'code' | 'name' | 'isActive' | 'isSystem' | 'createdBy'
		>[],
		db: DbContext,
	): Promise<void> {
		for (const item of items) {
			await this.repo.insert(
				{
					...item,
					...stampCreate(item.createdBy),
				},
				db,
			)
		}
		await this.invalidate()
	}

	async create(data: PaymentProviderCreateDto, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			db: this.repo.db,
			table: paymentProvidersTable,
			pkColumn: paymentProvidersTable.id,
			fields: uniqueFields,
			input: data,
		})

		const result = await this.repo.insert({
			...data,
			...stampCreate(actorId),
		})
		if (!result) throw PaymentProviderError.createFailed()

		await this.invalidate()
		return result
	}

	async update(data: PaymentProviderUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = await this.getById(id)
		if (!existing) throw PaymentProviderError.notFound(id)
		if (existing.isSystem) throw PaymentProviderError.isSystem(id)

		await checkConflict({
			db: this.repo.db,
			table: paymentProvidersTable,
			pkColumn: paymentProvidersTable.id,
			fields: uniqueFields,
			input: data,
			existing,
		})

		const result = await this.repo.update(id, {
			...data,
			...stampUpdate(actorId),
		})
		if (!result) throw PaymentProviderError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async remove(id: number): Promise<EntityRef> {
		const existing = await this.getById(id)
		if (!existing) throw PaymentProviderError.notFound(id)
		if (existing.isSystem) throw PaymentProviderError.isSystem(id)

		const result = await this.repo.remove(id)
		if (!result) throw PaymentProviderError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async handleList(
		filter: PaymentProviderFilterDto,
	): Promise<WithPaginationResult<PaymentProviderDto>> {
		return record('PaymentProviderService.handleList', async () =>
			this.repo.findPage(filter),
		)
	}

	async handleGetById(id: number): Promise<PaymentProviderDto> {
		return record('PaymentProviderService.handleGetById', async () => {
			const result = await this.getById(id)
			if (!result) throw PaymentProviderError.notFound(id)
			return result
		})
	}

	async handleCreate(
		data: PaymentProviderCreateDto,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('PaymentProviderService.handleCreate', async () =>
			this.create(data, actorId),
		)
	}

	async handleUpdate(
		data: PaymentProviderUpdateDto,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('PaymentProviderService.handleUpdate', async () =>
			this.update(data, actorId),
		)
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('PaymentProviderService.handleRemove', async () =>
			this.remove(id),
		)
	}
}
