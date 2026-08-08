import { NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const AuditError = {
	notFound: (id: number) =>
		new NotFoundError('Audit log entry not found', { code: 'AUDIT_NOT_FOUND', context: { id } }),
}
