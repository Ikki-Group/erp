// @ts-nocheck
import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'

import { NotFoundError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/types/pagination'

import type {
	PaymentProviderCreateDto,
	PaymentProviderDto,
	PaymentProviderFilterDto,
	PaymentProviderUpdateDto,
} from './payment-provider.dto'
import { PaymentProviderRepo } from './payment-provider.repo'

export class PaymentProviderService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: PaymentProviderRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'payment.provider')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: string): Promise<PaymentProviderDto> {
		return record('PaymentProviderService.getById', async () => {
			const key = `byId:${id}`
			const provider = await this.cache.getOrSetWithSkip({
				key,
				factory: () => this.repo.getById(id),
			})
			if (!provider)
				throw new NotFoundError(
					`Payment provider with ID ${id} not found`,
					{ code: 'PAYMENT_PROVIDER_NOT_FOUND' })
			return provider
		})
	}

	async getByCode(code: string): Promise<PaymentProviderDto | undefined> {
		return record('PaymentProviderService.getByCode', async () => {
			const key = `byCode:${code}`
			return this.cache.getOrSetWithSkip({
				key,
				factory: () => this.repo.getByCode(code),
			})
		})
	}

	async find(): Promise<PaymentProviderDto[]> {
		return record('PaymentProviderService.find', async () => {
			const key = 'list'
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getAll(),
			})
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: PaymentProviderFilterDto,
	): Promise<WithPaginationResult<PaymentProviderDto>> {
		return record('PaymentProviderService.handleList', async () => {
			const key = `list.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getListPaginated(filter),
			})
		})
	}

	async handleDetail(id: string): Promise<PaymentProviderDto> {
		return record('PaymentProviderService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: PaymentProviderCreateDto, actorId: string): Promise<{ id: string }> {
		return record('PaymentProviderService.handleCreate', async () => {
			const result = await this.repo.create(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return result
		})
	}

	async handleUpdate(
		id: string,
		data: Partial<PaymentProviderUpdateDto>,
		actorId: string,
	): Promise<{ id: string }> {
		return record('PaymentProviderService.handleUpdate', async () => {
			const result = await this.repo.update(id, data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	async handleRemove(id: string): Promise<{ id: string }> {
		return record('PaymentProviderService.handleRemove', async () => {
			const result = await this.repo.delete(id)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	/* --------------------------------- INTERNAL -------------------------------- */

	async seed(
		data: (PaymentProviderCreateDto & { id?: string; createdBy: string })[],
	): Promise<void> {
		return record('PaymentProviderService.seed', async () => {
			for (const d of data) {
				await this.repo.create(d, d.createdBy)
			}
			await this.cache.deleteMany({ keys: ['list', 'count'] })
		})
	}
}
