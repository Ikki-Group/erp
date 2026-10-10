import type { Infra } from '@/shared/module.ts'

import { AuditRepo } from './audit.repo.ts'
import { createAuditRoute } from './audit.route.ts'

/** Read side of the audit trail. Writes go through `infra.audit`. */
export function createAuditModule(infra: Infra) {
	return { route: createAuditRoute(new AuditRepo(infra.db)) }
}
