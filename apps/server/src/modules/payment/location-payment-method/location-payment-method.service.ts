import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/core/cache'
import type { WithPaginationResult } from '@/core/database/pagination'

import { NotFoundError } from '@/shared/errors/http-error'

import type {
	LocationPaymentMethodCreateDto,
	LocationPaymentMethodDto,
	LocationPaymentMethodFilterDto,
	LocationPaymentMethodUpdateDto,
} from './location-payment-method.dto'
import { LocationPaymentMethodRepo } from './location-payment-method.repo'

export class LocationPaymentMethodService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: LocationPaymentMethodRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'location.payment.method', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<LocationPaymentMethodDto> {
		return record('LocationPaymentMethodService.getById', async () => {
			const key = `byId:${id}`
			const locationPaymentMethod = await this.cache.getOrSetSkipUndefined({
				key,
				factory: () => this.repo.getById(id),
			})
			if (!locationPaymentMethod)
				throw new NotFoundError(
					`Location payment method with ID ${id} not found`,
					'LOCATION_PAYMENT_METHOD_NOT_FOUND',
				)
			return locationPaymentMethod
		})
	}

	async getByLocation(locationId: number): Promise<LocationPaymentMethodDto[]> {
		return record('LocationPaymentMethodService.getByLocation', async () => {
			const key = `byLocation:${locationId}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getByLocation(locationId),
			})
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: LocationPaymentMethodFilterDto,
	): Promise<WithPaginationResult<LocationPaymentMethodDto>> {
		return record('LocationPaymentMethodService.handleList', async () => {
			const key = `list.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getListPaginated(filter),
			})
		})
	}

	async handleDetail(id: number): Promise<LocationPaymentMethodDto> {
		return record('LocationPaymentMethodService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(
		data: LocationPaymentMethodCreateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('LocationPaymentMethodService.handleCreate', async () => {
			const result = await this.repo.create(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byLocation:${data.locationId}`] })
			return result
		})
	}

	async handleUpdate(
		id: number,
		data: Partial<LocationPaymentMethodUpdateDto>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('LocationPaymentMethodService.handleUpdate', async () => {
			const existing = await this.getById(id)
			const result = await this.repo.update(id, data, actorId)
			await this.cache.deleteMany({
				keys: ['list', 'count', `byId:${id}`, `byLocation:${existing.locationId}`],
			})
			return result
		})
	}

	async handleRemove(id: number): Promise<{ id: number }> {
		return record('LocationPaymentMethodService.handleRemove', async () => {
			const existing = await this.getById(id)
			const result = await this.repo.delete(id)
			await this.cache.deleteMany({
				keys: ['list', 'count', `byId:${id}`, `byLocation:${existing.locationId}`],
			})
			return result
		})
	}
}
