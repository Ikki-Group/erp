import { record } from '@elysiajs/opentelemetry'

import type { WithPaginationResult } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'

import { CacheService, type CacheClient } from '@/lib/cache'
import type { RecordId } from '@/lib/validation'

import * as dto from './audit-log.dto'
import { AuditLogRepo } from './audit-log.repo'

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

	async getById(id: number): Promise<dto.AuditLogDto | undefined> {
		return record('AuditLogService.getById', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.getById(id),
			})
		})
	}

	async log(data: dto.AuditLogCreateDto, actorId: number): Promise<number | undefined> {
		return record('AuditLogService.log', async () => {
			return this.repo.create(data, actorId)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: dto.AuditLogFilterDto): Promise<WithPaginationResult<dto.AuditLogDto>> {
		return record('AuditLogService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<dto.AuditLogDto> {
		return record('AuditLogService.handleDetail', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: dto.AuditLogCreateDto, actorId: number): Promise<RecordId> {
		return record('AuditLogService.handleCreate', async () => {
			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			await this.cache.deleteMany({ keys: ['list', 'count'] })

			return { id: result }
		})
	}
}
