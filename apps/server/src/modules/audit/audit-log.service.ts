import { CacheService, type CacheClient } from '@/core/cache'
import type { WithPaginationResult } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'

import type { ActorId, EntityRef } from '@/types/utils'

import { AuditLogRepo } from './audit-log.repo'
import type { AuditLogSchema, AuditLogCreateSchema, AuditLogFilterSchema } from './audit-log.schema'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Audit log with ID ${id} not found`, 'AUDIT_LOG_NOT_FOUND'),
	createFailed: () =>
		new InternalServerError('Audit log creation failed', 'AUDIT_LOG_CREATE_FAILED'),
}

export class AuditLogService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: AuditLogRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'audit-log', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<AuditLogSchema | undefined> {
		return this.cache.getOrSetSkipUndefined({
			key: `byId:${id}`,
			factory: () => this.repo.getById(id),
		})
	}

	async log(data: AuditLogCreateSchema, actorId: ActorId): Promise<EntityRef> {
		return this.repo.create(data, actorId)
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: AuditLogFilterSchema): Promise<WithPaginationResult<AuditLogSchema>> {
		const result = await this.repo.getListPaginated(filter)
		return result
	}

	async handleDetail(id: number): Promise<AuditLogSchema> {
		const result = await this.repo.getById(id)
		if (!result) throw err.notFound(id)
		return result
	}

	async handleCreate(data: AuditLogCreateSchema, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.create(data, actorId)

		await this.cache.deleteMany({ keys: ['list', 'count'] })

		return result
	}
}
