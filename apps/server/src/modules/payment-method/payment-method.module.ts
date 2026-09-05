import { cache } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import type { LocationApi } from '@/modules/location/index.ts'

import { PaymentMethodRepo } from './payment-method.repo.ts'
import { createPaymentMethodRoute } from './payment-method.route.ts'
import { PaymentMethodService } from './payment-method.service.ts'

function createPaymentMethodModule(db: DbContext, locationService: LocationApi['service']) {
	const service = new PaymentMethodService(new PaymentMethodRepo(db), cache, locationService)
	return { route: createPaymentMethodRoute(service), service }
}

function isLocationApi(api: Record<string, unknown> | undefined): api is LocationApi {
	return Boolean(api?.service && typeof api.service === 'object')
}
export interface PaymentMethodApi extends Record<string, unknown> {
	service: PaymentMethodService
	byLocation: PaymentMethodService['handleByLocation']
}

export const paymentMethodModule: ModuleDescriptor = {
	name: 'payment-method',
	layer: 1,
	dependsOn: ['location'],
	create(ctx, deps) {
		if (!isLocationApi(deps.location?.api)) throw new Error('Location API dependency is missing')
		const built = createPaymentMethodModule(ctx.db, deps.location.api.service)
		const api: PaymentMethodApi = {
			service: built.service,
			byLocation: built.service.handleByLocation.bind(built.service),
		}
		return { route: built.route, api }
	},
}
