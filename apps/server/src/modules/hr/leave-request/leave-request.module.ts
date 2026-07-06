import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { LeaveRequestRepo } from './leave-request.repo'
import { LeaveRequestService } from './leave-request.service'

export type LeaveRequestModule = LeaveRequestService

export function createLeaveRequestModule(
	db: DbClient,
	cacheClient: CacheClient,
): LeaveRequestModule {
	const repo = new LeaveRequestRepo(db)
	return new LeaveRequestService(repo, cacheClient)
}
