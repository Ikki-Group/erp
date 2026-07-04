import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const EmployeeError = {
	notFound: (id: number) =>
		new NotFoundError('Employee not found', { code: 'EMPLOYEE_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Employee creation failed', { code: 'EMPLOYEE_CREATE_FAILED' }),
}
