import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { PaymentMethodRepo } from './payment-method.repo'
import { PaymentMethodService } from './payment-method.service'

export type PaymentMethodModule = PaymentMethodService

export function createPaymentMethodModule(db: DbContext, cacheClient: CacheClient): PaymentMethodModule {
	const repo = new PaymentMethodRepo(db)
	const service = new PaymentMethodService(repo, cacheClient)

	return service
}
