import { CacheService, type CacheClient } from '@/core/cache'
import { InternalServerError, NotFoundError } from '@/core/http/errors'

import type { ActorId, EntityRef } from '@/types/utils'

import { CompanySettingsRepo } from './company-settings.repo'
import type {
	CompanySettingsSchema,
	CompanySettingsCreateSchema,
	CompanySettingsUpdateSchema,
} from './company-settings.schema'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Company settings with ID ${id} not found`, 'COMPANY_SETTINGS_NOT_FOUND'),
	notConfigured: () =>
		new InternalServerError('Company settings not configured', 'COMPANY_SETTINGS_NOT_CONFIGURED'),
	createFailed: () =>
		new InternalServerError('Company settings creation failed', 'COMPANY_SETTINGS_CREATE_FAILED'),
}

export class CompanySettingsService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: CompanySettingsRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'company-settings', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async get(): Promise<CompanySettingsSchema> {
		const result = await this.cache.getOrSetSkipUndefined({
			key: 'list',
			factory: () => this.repo.get(),
		})
		if (!result) throw err.notConfigured()
		return result
	}

	async getById(id: number): Promise<CompanySettingsSchema | undefined> {
		return this.cache.getOrSetSkipUndefined({
			key: `byId:${id}`,
			factory: () => this.repo.getById(id),
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleGet(): Promise<CompanySettingsSchema> {
		return this.get()
	}

	async handleDetail(id: number): Promise<CompanySettingsSchema> {
		const result = await this.repo.getById(id)
		if (!result) throw err.notFound(id)
		return result
	}

	async handleCreate(data: CompanySettingsCreateSchema, actorId: ActorId): Promise<EntityRef> {
		// Check if settings already exist (should be single instance)
		const existing = await this.repo.get()
		if (existing) {
			throw new InternalServerError(
				'Company settings already exist. Use update instead.',
				'COMPANY_SETTINGS_ALREADY_EXISTS',
			)
		}

		const result = await this.repo.create(data, actorId)

		await this.cache.deleteMany({ keys: ['list', 'count'] })

		return result
	}

	async handleUpdate(data: CompanySettingsUpdateSchema, actorId: ActorId): Promise<EntityRef> {
		const { id } = data

		const existing = await this.getById(id)
		if (!existing) throw err.notFound(id)

		const result = await this.repo.update(data, actorId)

		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

		return result
	}
}
