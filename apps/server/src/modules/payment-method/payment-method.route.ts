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
		tag: 'Payment Methods',
		entity: 'payment method',
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
				detail: { summary: 'List payment methods at a location' },
			},
		)
		.post(
			'/location/assign',
			async ({ body, actor }) => res.ok(await service.handleAssign(body, actor)),
			{
				body: PaymentMethodLocationAssignDto,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.update',
				detail: {
					summary: 'Assign a payment method to a location',
					description: 'Upserts the assignment, so calling it again updates `isEnabled`.',
				},
			},
		)
		.delete(
			'/location/unassign',
			async ({ body, actor }) => res.ok(await service.handleUnassign(body, actor)),
			{
				body: PaymentMethodLocationAssignDto,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.update',
				detail: { summary: 'Unassign a payment method from a location' },
			},
		)
}
