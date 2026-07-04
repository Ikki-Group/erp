import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { PaymentProviderRepo } from './payment-provider.repo'
import { PaymentProviderService } from './payment-provider.service'

export type PaymentProviderModule = PaymentProviderService

export function createPaymentProviderModule(
	db: DbContext,
	cacheClient: CacheClient,
): PaymentProviderModule {
	const repo = new PaymentProviderRepo(db)
	const service = new PaymentProviderService(repo, cacheClient)
	return service
}
