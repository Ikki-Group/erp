import type { AuditLog } from '@/infra/audit.ts'
import type { DbContext, UnitOfWork } from '@/infra/database/index.ts'

/** Infrastructure handed to every module factory. */
export interface Infra {
	db: DbContext
	uow: UnitOfWork
	audit: AuditLog
}
