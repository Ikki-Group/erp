import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const SalesInvoiceError = {
	notFound: (id: number) =>
		new NotFoundError('Sales invoice not found', {
			code: 'SALES_INVOICE_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Sales invoice creation failed', {
			code: 'SALES_INVOICE_CREATE_FAILED',
		}),
	generateFailed: () =>
		new InternalServerError('Sales invoice generation failed', {
			code: 'SALES_INVOICE_GENERATE_FAILED',
		}),
	updateFailed: () =>
		new InternalServerError('Sales invoice update failed', {
			code: 'SALES_INVOICE_UPDATE_FAILED',
		}),
}
