import { InternalServerError } from '@/shared/errors/http-error'

export const InventoryReportingError = {
	queryFailed: () =>
		new InternalServerError('Inventory reporting query failed', {
			code: 'INVENTORY_REPORTING_QUERY_FAILED',
		}),
}
