import { EmployeeService } from './employee.service'

export class EmployeeServiceModule {
	public employee: EmployeeService

	constructor() {
		this.employee = new EmployeeService()
	}
}

export * from './employee.service'
