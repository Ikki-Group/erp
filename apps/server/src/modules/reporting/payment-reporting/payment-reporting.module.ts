import type { DbContext } from '@/infra/database'

import { PaymentReportingRepo } from './payment-reporting.repo'
import { PaymentReportingService } from './payment-reporting.service'

export type PaymentReportingModule = PaymentReportingService

export function createPaymentReportingModule(db: DbContext): PaymentReportingModule {
	const repo = new PaymentReportingRepo(db)
	const service = new PaymentReportingService(repo)

	return service
}
