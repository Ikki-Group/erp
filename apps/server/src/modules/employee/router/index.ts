import Elysia from 'elysia'
import type { EmployeeServiceModule } from '../service'
import { initEmployeeRoute } from './employee.route'

export function initEmployeeRouteModule(service: EmployeeServiceModule) {
	const employeeRouter = initEmployeeRoute(service)
	return new Elysia().use(employeeRouter)
}

export * from './employee.route'
