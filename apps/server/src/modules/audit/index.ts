import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type {
	AuditLogDto,
	AuditActionDto,
	AuditLogCreateDto,
	AuditLogFilterDto,
} from './audit-log.contract'
import { AuditLogRepo } from './audit-log.repo'
import { initAuditLogRoute } from './audit-log.route'
import { AuditLogService } from './audit-log.service'

export class AuditServiceModule {
	public readonly log: AuditLogService

	constructor(db: DbClient, cacheClient: CacheClient) {
		const repo = new AuditLogRepo(db)
		this.log = new AuditLogService(repo, cacheClient)
	}
}

export function initAuditRouteModule(service: AuditServiceModule) {
	const auditLogRouter = initAuditLogRoute(service.log)

	return new Elysia({ prefix: '/audit' }).use(auditLogRouter)
}

export type { AuditLogDto, AuditActionDto, AuditLogCreateDto, AuditLogFilterDto }
export type { AuditLogService } from './audit-log.service'
