import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { PaymentRepo } from './payment.repo'
import { PaymentService } from './payment.service'

export type PaymentModule = PaymentService

export function createPaymentModule(db: DbContext, cacheClient: CacheClient): PaymentModule {
	const repo = new PaymentRepo(db)
	const payment = new PaymentService(repo, cacheClient)

	return payment
}
