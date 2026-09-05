import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { AuthContext } from '@/shared/auth/index.ts'
import type { CachePort } from '@/shared/cache/cache.port.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { toDecimal } from '@/shared/utils/money.ts'

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
	constructor(private readonly deps: CompanyServiceDeps) {}

	async getSettings(): Promise<CompanySettingsDto | undefined> {
		return this.deps.cache.getOrSetOptional('company', 'settings', () => this.deps.repo.findOne())
	}

	async handleGetSettings(): Promise<CompanySettingsDto> {
		const settings = await this.getSettings()
		if (!settings) throw CompanyError.notFound()
		return settings
	}

	async handleUpdate(data: CompanySettingsUpdateDto, auth: AuthContext): Promise<EntityRef> {
		const { id, ...updateData } = data
		const result = await this.deps.uow.run(async (tx) => {
			const existing = await this.deps.repo.findOne(tx)
			if (!existing || existing.id !== id) throw CompanyError.notFound()

			const written = await this.deps.repo.update(id, updateData, tx)
			if (!written) throw CompanyError.updateFailed()

			await this.deps.audit.record(
				{
					actorId: auth.userId,
					actorName: auth.userName,
					locationId: auth.locationId,
					module: 'company',
					entity: 'company_settings',
					entityId: id,
					action: 'update',
					summary: `Updated company settings "${updateData.name}"`,
					newValues: {
						name: updateData.name,
						currencyCode: updateData.currencyCode,
						taxRate: updateData.taxRate,
					},
				},
				tx,
			)
			return written
		})

		await this.deps.cache.invalidate('company', result.id)
		return result
	}

	async getTaxRatePercent(): Promise<number> {
		const settings = await this.handleGetSettings()
		return toDecimal(settings.taxRate).toNumber()
	}
}
