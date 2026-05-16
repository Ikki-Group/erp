import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { AuditLogRepo } from './audit-log.repo'
import { initAuditLogRoute } from './audit-log.route'
import type {
	AuditLogSchema,
	AuditActionSchema,
	AuditLogCreateSchema,
	AuditLogFilterSchema,
} from './audit-log.schema'
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

export type { AuditLogSchema, AuditActionSchema, AuditLogCreateSchema, AuditLogFilterSchema }
export type { AuditLogService } from './audit-log.service'
