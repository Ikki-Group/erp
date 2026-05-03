import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { CacheClient } from '@/lib/cache'

import { EmployeeRepo } from './employee.repo'
import { initEmployeeRoute } from './employee.route'
import { EmployeeService } from './employee.service'

export class EmployeeServiceModule {
	public readonly employee: EmployeeService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const employeeRepo = new EmployeeRepo(this.db)
		this.employee = new EmployeeService(employeeRepo, this.cacheClient)
	}
}

export function initEmployeeRouteModule(service: EmployeeServiceModule) {
	return new Elysia().use(initEmployeeRoute(service.employee))
}

export * from './employee.dto'
export type { EmployeeService } from './employee.service'
