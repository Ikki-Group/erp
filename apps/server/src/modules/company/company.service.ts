import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { CachePort } from '@/shared/cache/cache.port.ts'
import { mutate } from '@/shared/service/mutate.ts'
import type { MutationScope } from '@/shared/service/mutate.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { CompanySettingsDto, CompanySettingsUpdateDto } from './company.contract.ts'
import { CompanyError } from './company.internal.ts'
import type { ICompanyRepo } from './company.repo.ts'

export interface CompanyServiceDeps {
	repo: ICompanyRepo
	uow: UnitOfWork
	cache: CachePort
	audit: AuditPort
}

export class CompanyService {
	private readonly mutation: MutationScope

	constructor(private readonly deps: CompanyServiceDeps) {
		this.mutation = {
			uow: deps.uow,
			audit: deps.audit,
			module: 'company',
			entity: 'company_settings',
			invalidate: (ref) => deps.cache.invalidate('company', ref.id),
		}
	}

	async getSettings(): Promise<CompanySettingsDto | undefined> {
		return this.deps.cache.getOrSetOptional('company', 'settings', () => this.deps.repo.findOne())
	}

	async handleGetSettings(): Promise<CompanySettingsDto> {
		const settings = await this.getSettings()
		if (!settings) throw CompanyError.notFound()
		return settings
	}

	async handleUpdate(data: CompanySettingsUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data
		return mutate(this.mutation, actor, async (tx) => {
			const existing = await this.deps.repo.findOne(tx)
			if (!existing || existing.id !== id) throw CompanyError.notFound()

			const written = await this.deps.repo.update(id, updateData, tx)
			if (!written) throw CompanyError.updateFailed()
			return {
				result: written,
				audit: {
					action: 'update',
					summary: `Updated company settings "${updateData.name}"`,
					newValues: {
						name: updateData.name,
						currencyCode: updateData.currencyCode,
						taxRate: updateData.taxRate,
					},
				},
			}
		})
	}

	async getTaxRatePercent(): Promise<string> {
		const settings = await this.handleGetSettings()
		return settings.taxRate
	}
}
