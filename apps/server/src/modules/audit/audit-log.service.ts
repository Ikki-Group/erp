import { CacheService, type CacheClient } from '@/infra/cache'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type { AuditLogDto, AuditLogCreateDto, AuditLogFilterDto } from './audit-log.contract'
import { AuditLogRepo } from './audit-log.repo'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Audit log with ID ${id} not found`, { code: 'AUDIT_LOG_NOT_FOUND' }),
	createFailed: () =>
		new InternalServerError('Audit log creation failed', { code: 'AUDIT_LOG_CREATE_FAILED' }),
}

export class AuditLogService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: AuditLogRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'audit-log')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<AuditLogDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: `byId:${id}`,
			factory: () => this.repo.getById(id),
		})
	}

	async log(data: AuditLogCreateDto, actorId: ActorId): Promise<EntityRef> {
		return this.repo.create(data, actorId)
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: AuditLogFilterDto): Promise<WithPaginationResult<AuditLogDto>> {
		const result = await this.repo.getListPaginated(filter)
		return result
	}

	async handleDetail(id: number): Promise<AuditLogDto> {
		const result = await this.repo.getById(id)
		if (!result) throw err.notFound(id)
		return result
	}

	async handleCreate(data: AuditLogCreateDto, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.create(data, actorId)

		await this.cache.deleteMany({ keys: ['list', 'count'] })

		return result
	}
}
