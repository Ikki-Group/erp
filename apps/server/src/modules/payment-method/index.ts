import type { Infra } from '@/shared/module.ts'

import type { LocationService } from '@/modules/location/index.ts'

import { PaymentMethodRepo } from './payment-method.repo.ts'
import { createPaymentMethodRoute } from './payment-method.route.ts'
import { PaymentMethodService } from './payment-method.service.ts'

export function createPaymentMethodModule(
	infra: Infra,
	deps: { location: Pick<LocationService, 'handleGetById'> },
) {
	const paymentMethodService = new PaymentMethodService({
		...infra,
		repo: new PaymentMethodRepo(infra.db),
		location: deps.location,
	})
	return { route: createPaymentMethodRoute(paymentMethodService), paymentMethodService }
}

export type { PaymentMethodService }
