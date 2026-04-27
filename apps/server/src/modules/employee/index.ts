import { Elysia } from 'elysia'

import { initEmployeeRoute } from './employee/employee.route'
import { EmployeeService } from './employee/employee.service'

export class EmployeeServiceModule {
	public readonly employee: EmployeeService

	constructor() {
		this.employee = new EmployeeService()
	}
}

export function initEmployeeRouteModule(service: EmployeeServiceModule) {
	return new Elysia().use(initEmployeeRoute(service.employee))
}

export * from './employee/employee.dto'
export * from './employee/employee.repo'
export * from './employee/employee.service'
export * from './employee/employee.route'
