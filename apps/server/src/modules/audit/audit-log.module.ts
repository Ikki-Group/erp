import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { AuditLogRepo } from './audit-log.repo'
import { AuditLogService } from './audit-log.service'

export type AuditLogModule = AuditLogService

export function createAuditLogModule(db: DbContext, cacheClient: CacheClient): AuditLogModule {
	const repo = new AuditLogRepo(db)
	const log = new AuditLogService(repo, cacheClient)

	return log
}
