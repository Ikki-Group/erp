import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { CacheClient } from '@/lib/cache'

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

export { AuditLogDto, AuditActionDto } from './audit-log.dto'
export { AuditLogService } from './audit-log.service'
