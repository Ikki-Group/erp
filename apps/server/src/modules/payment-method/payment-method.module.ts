import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import { PaymentMethodRepo } from './payment-method.repo.ts'
import { createPaymentMethodRoute } from './payment-method.route.ts'
import { PaymentMethodService } from './payment-method.service.ts'

// ─── Dependencies ───

export interface PaymentMethodModuleDeps {
	locationService: LocationService
}

// ─── Module Factory ───

export function createPaymentMethodModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: PaymentMethodModuleDeps,
) {
	const repo = new PaymentMethodRepo(db)
	const service = new PaymentMethodService(repo, cacheClient, deps.locationService)
	const route = createPaymentMethodRoute(service)
	return { route, service }
}
