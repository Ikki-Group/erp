import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { LocationPaymentMethodRepo } from './location-payment-method.repo'
import {
	LocationPaymentMethodService,
	type LocationReadPort,
	type PaymentMethodReadPort,
} from './location-payment-method.service'

export type LocationPaymentMethodModule = LocationPaymentMethodService

interface LocationPaymentMethodModuleDeps {
	location: LocationReadPort
	paymentMethod: PaymentMethodReadPort
}

export function createLocationPaymentMethodModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: LocationPaymentMethodModuleDeps,
): LocationPaymentMethodModule {
	const repo = new LocationPaymentMethodRepo(db)
	const service = new LocationPaymentMethodService(repo, cacheClient, deps)

	return service
}

export type { LocationReadPort, PaymentMethodReadPort }
