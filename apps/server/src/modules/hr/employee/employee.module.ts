import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { EmployeeRepo } from './employee.repo'
import { EmployeeService } from './employee.service'

export type EmployeeModule = EmployeeService

export function createEmployeeModule(db: DbContext, cacheClient: CacheClient): EmployeeModule {
	const repo = new EmployeeRepo(db)
	const service = new EmployeeService(repo, cacheClient)

	return service
}
