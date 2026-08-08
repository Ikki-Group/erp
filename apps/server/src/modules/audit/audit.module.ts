import type { DbContext } from '@/infra/database/index.ts'

import { AuditRepo } from './audit.repo.ts'
import { createAuditRoute } from './audit.route.ts'
import { AuditService } from './audit.service.ts'

export function createAuditModule(db: DbContext) {
	const repo = new AuditRepo(db)
	const service = new AuditService(repo)
	const route = createAuditRoute(service)
	return { route, service }
}
