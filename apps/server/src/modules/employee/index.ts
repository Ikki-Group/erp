import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { EmployeeRepo } from './employee/employee.repo'
import { initEmployeeRoute } from './employee/employee.route'
import { EmployeeService } from './employee/employee.service'

export class EmployeeServiceModule {
	public readonly employee: EmployeeService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const employeeRepo = new EmployeeRepo(this.db, this.cacheClient)
		this.employee = new EmployeeService(employeeRepo)
	}
}

export function initEmployeeRouteModule(service: EmployeeServiceModule) {
	return new Elysia().use(initEmployeeRoute(service.employee))
}
