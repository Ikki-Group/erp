import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { AuditLogDto, AuditLogCreateDto, AuditLogFilterDto } from './audit-log.contract'
import { AuditLogError } from './audit-log.internal'
import type { IAuditLogRepo } from './audit-log.repo'

export class AuditLogService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IAuditLogRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'audit-log')
	}

	private async invalidate(): Promise<void> {
		await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
	}

	async getById(id: number): Promise<AuditLogDto | undefined> {
		return record('AuditLogService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async log(data: AuditLogCreateDto): Promise<EntityRef> {
		const result = await this.repo.insert(data)
		if (!result) throw AuditLogError.createFailed()
		await this.invalidate()
		return result
	}

	async handleList(filter: AuditLogFilterDto): Promise<WithPaginationResult<AuditLogDto>> {
		return record('AuditLogService.handleList', async () => this.repo.findPage(filter))
	}

	async handleDetail(id: number): Promise<AuditLogDto> {
		return record('AuditLogService.handleDetail', async () => {
			const result = await this.repo.findById(id)
			if (!result) throw AuditLogError.notFound(id)
			return result
		})
	}

	async handleCreate(data: AuditLogCreateDto): Promise<EntityRef> {
		return record('AuditLogService.handleCreate', async () => this.log(data))
	}
}
