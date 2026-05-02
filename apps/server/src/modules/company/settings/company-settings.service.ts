import { record } from '@elysiajs/opentelemetry'

import { InternalServerError, NotFoundError } from '@/core/http/errors'
import type { RecordId } from '@/core/validation'

import * as dto from './company-settings.dto'
import { CompanySettingsRepo } from './company-settings.repo'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Company settings with ID ${id} not found`, 'COMPANY_SETTINGS_NOT_FOUND'),
	notConfigured: () =>
		new InternalServerError('Company settings not configured', 'COMPANY_SETTINGS_NOT_CONFIGURED'),
	createFailed: () =>
		new InternalServerError('Company settings creation failed', 'COMPANY_SETTINGS_CREATE_FAILED'),
}

export class CompanySettingsService {
	constructor(private readonly repo: CompanySettingsRepo) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async get(): Promise<dto.CompanySettingsDto> {
		return record('CompanySettingsService.get', async () => {
			const result = await this.repo.get()
			if (!result) throw err.notConfigured()
			return result
		})
	}

	async getById(id: number): Promise<dto.CompanySettingsDto | undefined> {
		return record('CompanySettingsService.getById', async () => {
			return this.repo.getById(id)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleGet(): Promise<dto.CompanySettingsDto> {
		return record('CompanySettingsService.handleGet', async () => {
			return this.get()
		})
	}

	async handleDetail(id: number): Promise<dto.CompanySettingsDto> {
		return record('CompanySettingsService.handleDetail', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: dto.CompanySettingsCreateDto, actorId: number): Promise<RecordId> {
		return record('CompanySettingsService.handleCreate', async () => {
			// Check if settings already exist (should be single instance)
			const existing = await this.repo.get()
			if (existing) {
				throw new InternalServerError(
					'Company settings already exist. Use update instead.',
					'COMPANY_SETTINGS_ALREADY_EXISTS',
				)
			}

			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			return { id: result }
		})
	}

	async handleUpdate(data: dto.CompanySettingsUpdateDto, actorId: number): Promise<RecordId> {
		return record('CompanySettingsService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)

			return { id }
		})
	}
}
