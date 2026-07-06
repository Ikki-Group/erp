import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const PayrollError = {
	batchNotFound: (id: number) =>
		new NotFoundError('Payroll batch not found', {
			code: 'PAYROLL_BATCH_NOT_FOUND',
			context: { id },
		}),
	batchAlreadyExists: (month: number, year: number) =>
		new ConflictError(`Payroll batch for ${month}/${year} already exists`, {
			code: 'PAYROLL_BATCH_ALREADY_EXISTS',
			context: { month, year },
		}),
	onlyDraftCanBeFinalized: () =>
		new ConflictError('Only draft batches can be finalized', {
			code: 'PAYROLL_BATCH_NOT_DRAFT',
		}),
	createBatchFailed: () =>
		new InternalServerError('Failed to create payroll batch', {
			code: 'PAYROLL_BATCH_CREATE_FAILED',
		}),
	createAdjustmentFailed: () =>
		new InternalServerError('Failed to create payroll adjustment', {
			code: 'PAYROLL_ADJUSTMENT_CREATE_FAILED',
		}),
	finalizeBatchFailed: () =>
		new InternalServerError('Failed to finalize batch', {
			code: 'PAYROLL_BATCH_FINALIZE_FAILED',
		}),
}
