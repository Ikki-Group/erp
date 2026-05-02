import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { AuditLogRepo } from './audit-log/audit-log.repo'
import { initAuditLogRoute } from './audit-log/audit-log.route'
import { AuditLogService } from './audit-log/audit-log.service'

export class AuditServiceModule {
	public readonly log: AuditLogService

	constructor(db: DbClient, cacheClient: CacheClient) {
		const repo = new AuditLogRepo(db, cacheClient)
		this.log = new AuditLogService(repo)
	}
}

export function initAuditRouteModule(service: AuditServiceModule) {
	const auditLogRouter = initAuditLogRoute(service.log)

	return new Elysia({ prefix: '/audit' }).use(auditLogRouter)
}

export { AuditLogDto, AuditActionDto } from './audit-log/audit-log.dto'
export { AuditLogService } from './audit-log/audit-log.service'
