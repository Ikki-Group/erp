import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import { requirePermission } from '@/shared/auth/index.ts'
import type { AuthContext } from '@/shared/auth/index.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type {
	CompanySettingsCreateDto,
	CompanySettingsDto,
	CompanySettingsUpdateDto,
} from './company.contract.ts'
import { CompanyError } from './company.internal.ts'
import type { ICompanyRepo } from './company.repo.ts'

// ─── Constants ───

const PERMISSION_UPDATE = 'core:company:update'

// ─── Service ───

export class CompanyService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ICompanyRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'company')
	}

	// ─── Cached Reads ───

	async getSettings(): Promise<CompanySettingsDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.list,
			factory: () => this.repo.findOne(),
		})
	}

	// ─── Handlers ───

	async handleGetSettings(): Promise<CompanySettingsDto> {
		return assertFound(await this.getSettings(), () => CompanyError.notFound())
	}

	async handleCreate(data: CompanySettingsCreateDto, auth: AuthContext): Promise<EntityRef> {
		// 1. Permission check
		requirePermission(auth, PERMISSION_UPDATE)

		// 2. Singleton guard
		const existing = await this.repo.count()
		if (existing > 0) throw CompanyError.alreadyExists()

		// 3. Insert
		const result = await this.repo.insert({
			...data,
			...stampCreate(auth.userId),
		})
		if (!result) throw CompanyError.createFailed()

		// 4. Invalidate cache
		await this.cache.invalidateStandard()

		// 5. Audit log
		auditLog.record({
			userId: auth.userId,
			userName: '',
			module: 'company',
			entity: 'company_settings',
			entityId: result.id,
			action: 'create',
			summary: `Created company settings "${data.name}"`,
			newValues: { name: data.name, currencyCode: data.currencyCode, taxRate: data.taxRate },
		})

		return result
	}

	async handleUpdate(data: CompanySettingsUpdateDto, auth: AuthContext): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Permission check
		requirePermission(auth, PERMISSION_UPDATE)

		// 2. Verify exists
		await this.handleGetSettings()

		// 3. Update
		const result = await this.repo.update(id, {
			...updateData,
			...stampUpdate(auth.userId),
		})
		if (!result) throw CompanyError.updateFailed()

		// 4. Invalidate cache
		await this.cache.invalidateStandard()

		// 5. Audit log
		auditLog.record({
			userId: auth.userId,
			userName: '',
			module: 'company',
			entity: 'company_settings',
			entityId: id,
			action: 'update',
			summary: `Updated company settings "${data.name}"`,
			newValues: { name: data.name, currencyCode: data.currencyCode, taxRate: data.taxRate },
		})

		return result
	}
}
