import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { EmployeeRepo } from './core/employee.repo'
import { initEmployeeRoute } from './core/employee.route'
import { EmployeeService } from './core/employee.service'

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

export * from './core/employee.dto'
export type { EmployeeService } from './core/employee.service'
