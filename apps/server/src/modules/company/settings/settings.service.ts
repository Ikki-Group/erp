import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	CompanySettingsDto,
	CompanySettingsCreateDto,
	CompanySettingsUpdateDto,
} from './settings.contract'
import { CompanySettingsError } from './settings.internal'
import type { ICompanySettingsRepo, CompanySettingsInsert, CompanySettingsUpdate } from './settings.repo'

export class CompanySettingsService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ICompanySettingsRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'company-settings')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	async get(): Promise<CompanySettingsDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.list,
			factory: () => this.repo.get(),
		})
	}

	async getById(id: number): Promise<CompanySettingsDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async create(data: CompanySettingsCreateDto, actorId: ActorId): Promise<EntityRef> {
		const existing = await this.get()
		if (existing) throw CompanySettingsError.alreadyExists()

		const insertData: CompanySettingsInsert = {
			name: data.name,
			address: data.address || null,
			phone: data.phone || null,
			email: data.email || null,
			taxId: data.taxId || null,
			taxRate: data.taxRate !== undefined ? String(data.taxRate) : '0',
			logoUrl: data.logoUrl || null,
			invoiceFooter: data.invoiceFooter || null,
			receiptFooter: data.receiptFooter || null,
			currencyCode: data.currencyCode,
			currencySymbol: data.currencySymbol,
			settings: data.settings,
			...stampCreate(actorId),
		}
		const result = await this.repo.insert(insertData)
		if (!result) throw CompanySettingsError.createFailed()

		await this.invalidate()
		return result
	}

	async update(data: CompanySettingsUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = await this.getById(id)
		if (!existing) throw CompanySettingsError.notFound(id)

		const updateData: CompanySettingsUpdate = {
			name: data.name,
			address: data.address || null,
			phone: data.phone || null,
			email: data.email || null,
			taxId: data.taxId || null,
			taxRate: data.taxRate !== undefined ? String(data.taxRate) : undefined,
			logoUrl: data.logoUrl || null,
			invoiceFooter: data.invoiceFooter || null,
			receiptFooter: data.receiptFooter || null,
			currencyCode: data.currencyCode,
			currencySymbol: data.currencySymbol,
			settings: data.settings,
			...stampUpdate(actorId),
		}
		const result = await this.repo.update(id, updateData)
		if (!result) throw CompanySettingsError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async handleGet(): Promise<CompanySettingsDto> {
		return record('CompanySettingsService.handleGet', async () => {
			const result = await this.get()
			if (!result) throw CompanySettingsError.notConfigured()
			return result
		})
	}

	async handleDetail(id: number): Promise<CompanySettingsDto> {
		return record('CompanySettingsService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw CompanySettingsError.notFound(id)
			return result
		})
	}

	async handleCreate(data: CompanySettingsCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('CompanySettingsService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: CompanySettingsUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('CompanySettingsService.handleUpdate', async () => this.update(data, actorId))
	}
}
