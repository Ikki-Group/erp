import type { Actor } from '@/shared/auth/actor.ts'
import type { Infra } from '@/shared/module.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import { CompanyError } from './company.internal.ts'
import type { CompanyRepo } from './company.repo.ts'
import type { CompanySettingsDto, CompanySettingsUpdateDto } from '@ikki/contract/company'

interface Deps extends Infra {
	repo: CompanyRepo
}

export class CompanyService {
	constructor(private readonly deps: Deps) {}

	async handleGetSettings(): Promise<CompanySettingsDto> {
		const settings = await this.deps.repo.findOne()
		if (!settings) throw CompanyError.notFound()
		return settings
	}

	/** Company-wide tax rate as a percent string, e.g. "11". */
	async getTaxRatePercent(): Promise<string> {
		return (await this.handleGetSettings()).taxRate
	}

	handleUpdate(data: CompanySettingsUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findOne(tx)
			if (!existing || existing.id !== id) throw CompanyError.notFound()
			const written = await repo.update(id, { ...changes, updatedBy: actor.id }, tx)
			if (!written) throw CompanyError.updateFailed()
			await audit.record(tx, actor, {
				module: 'company',
				entity: 'company_settings',
				entityId: id,
				action: 'update',
				summary: `Updated company settings "${changes.name}"`,
				oldValues: { name: existing.name, taxRate: existing.taxRate },
				newValues: { name: changes.name, taxRate: changes.taxRate },
			})
			return written
		})
	}
}
