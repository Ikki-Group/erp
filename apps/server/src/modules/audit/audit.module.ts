import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import { AuditRepo } from './audit.repo.ts'
import { createAuditRoute } from './audit.route.ts'
import { AuditService } from './audit.service.ts'

export const auditModule: ModuleDescriptor = {
	name: 'audit',
	layer: 0,
	dependsOn: [],
	create(ctx) {
		const repo = new AuditRepo(ctx.db)
		const service = new AuditService(repo)
		return { route: createAuditRoute(service), api: {} }
	},
}
