import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const AuditLogError = {
	notFound: (id: number) =>
		new NotFoundError('Audit log not found', { code: 'AUDIT_LOG_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Audit log creation failed', { code: 'AUDIT_LOG_CREATE_FAILED' }),
}
