import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'
import { createSuccessResponseSchema, zc } from '@/lib/validation/index.ts'

import {
	PaymentMethodCreateDto,
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodUpdateDto,
} from './dto/index.ts'

// ─── By-Location Keys (defined first so mutations can reference them) ───

const byLocationUrl = endpoint.paymentMethod.byLocation

const byLocationKeys = {
	all: () => [byLocationUrl] as const,
	list: (locationId: number) => [byLocationUrl, { locationId }] as const,
}

// ─── Payment Method Resource (CRUD) ───

export const paymentMethodResource = defineResource({
	urls: endpoint.paymentMethod,
	entitySchema: PaymentMethodDto,
	filter: PaymentMethodFilterDto,
	create: PaymentMethodCreateDto,
	update: PaymentMethodUpdateDto,
})

// ─── Mutations with byLocation invalidation ───

const createMutation = defineMutation({
	method: 'post',
	url: endpoint.paymentMethod.create,
	body: PaymentMethodCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [paymentMethodResource.keys.lists(), byLocationKeys.all()],
})

const updateMutation = defineMutation({
	method: 'put',
	url: endpoint.paymentMethod.update,
	body: PaymentMethodUpdateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [paymentMethodResource.keys.lists(), byLocationKeys.all()],
})

const removeMutation = defineMutation({
	method: 'delete',
	url: endpoint.paymentMethod.remove,
	query: zc.RecordId,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [paymentMethodResource.keys.lists(), byLocationKeys.all()],
})

export const paymentMethodMutations = {
	create: createMutation,
	update: updateMutation,
	remove: removeMutation,
}

// ─── By-Location Query ───

const byLocationQuery = defineQuery({
	method: 'get',
	url: byLocationUrl,
	query: z.object({ locationId: z.coerce.number().int().positive() }),
	result: createSuccessResponseSchema(z.array(PaymentMethodDto)),
	queryKey: (query) => [byLocationUrl, query],
})

export const paymentMethodByLocation = {
	keys: byLocationKeys,
	query: byLocationQuery,
}
