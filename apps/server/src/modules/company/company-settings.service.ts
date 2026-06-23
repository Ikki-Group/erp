import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

import type { ActorId, EntityRef } from '@/shared/types/utils'

import { CompanySettingsRepo } from './company-settings.repo'
import type {
	CompanySettingsDto,
	CompanySettingsCreateDto,
	CompanySettingsUpdateDto,
} from './company-settings.schema'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Company settings with ID ${id} not found`, { code: 'COMPANY_SETTINGS_NOT_FOUND' }),
	notConfigured: () =>
		new InternalServerError('Company settings not configured', { code: 'COMPANY_SETTINGS_NOT_CONFIGURED' }),
	createFailed: () =>
		new InternalServerError('Company settings creation failed', { code: 'COMPANY_SETTINGS_CREATE_FAILED' }),
}

export class CompanySettingsService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: CompanySettingsRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'company-settings')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async get(): Promise<CompanySettingsDto> {
		return record('CompanySettingsService.get', async () => {
			const result = await this.cache.getOrSetWithSkip({
				key: this.cache.keys.list,
				factory: () => this.repo.get(),
			})
			if (!result) throw err.notConfigured()
			return result
		})
	}

	async getById(id: number): Promise<CompanySettingsDto | undefined> {
		return record('CompanySettingsService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.getById(id),
			}),
		)
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleGet(): Promise<CompanySettingsDto> {
		return record('CompanySettingsService.handleGet', () => this.get())
	}

	async handleDetail(id: number): Promise<CompanySettingsDto> {
		return record('CompanySettingsService.handleDetail', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: CompanySettingsCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('CompanySettingsService.handleCreate', async () => {
			// Check if settings already exist (should be single instance)
			const existing = await this.repo.get()
			if (existing) {
				throw new InternalServerError('Company settings already exist. Use update instead.', {
					code: 'COMPANY_SETTINGS_ALREADY_EXISTS',
				})
			}

			const result = await this.repo.create(data, actorId)

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])

			return result
		})
	}

	async handleUpdate(data: CompanySettingsUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('CompanySettingsService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			const result = await this.repo.update(data, actorId)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}
}
