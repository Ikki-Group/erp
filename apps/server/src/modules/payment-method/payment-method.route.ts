import { z } from 'zod'

import { crudRoutes } from '@/server/crud-route.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

import {
	PaymentMethodCreateDto,
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodLocationAssignDto,
	PaymentMethodUpdateDto,
} from './payment-method.contract.ts'
import type { PaymentMethodService } from './payment-method.service.ts'

export function createPaymentMethodRoute(service: PaymentMethodService) {
	return crudRoutes({
		prefix: '/payment-method',
		resource: 'payment-method',
		service,
		schemas: {
			filter: PaymentMethodFilterDto,
			dto: PaymentMethodDto,
			create: PaymentMethodCreateDto,
			update: PaymentMethodUpdateDto,
		},
	})
		.get(
			'/by-location',
			async ({ query }) => res.ok(await service.handleByLocation(query.locationId)),
			{
				query: z.object({ locationId: z.coerce.number().int().positive() }),
				response: zRes.ok(z.array(PaymentMethodDto)),
				permission: 'payment-method.read',
			},
		)
		.post(
			'/location/assign',
			async ({ body, actor }) => res.ok(await service.handleAssign(body, actor)),
			{
				body: PaymentMethodLocationAssignDto,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.update',
			},
		)
		.delete(
			'/location/unassign',
			async ({ body, actor }) => res.ok(await service.handleUnassign(body, actor)),
			{
				body: PaymentMethodLocationAssignDto,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.update',
			},
		)
}
