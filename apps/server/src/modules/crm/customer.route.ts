import { zc, zq } from '@/shared/schema'
import { createPaginatedResponseSchema, createSuccessResponseSchema } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	CustomerDto,
	CustomerFilterSchema,
	CustomerCreateSchema,
	CustomerUpdateSchema,
	CustomerAddPointsSchema,
	CustomerRedeemPointsSchema,
	CustomerLoyaltyTransactionSchema,
	CustomerGetByPhoneSchema,
} from './customer.schema'
import type { CustomerService } from './customer.service'

export function initCustomerRoute(service: CustomerService) {
	return new Elysia({ prefix: '/customer' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: CustomerFilterSchema,
				response: createPaginatedResponseSchema(CustomerDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(CustomerDto),
				auth: true,
			},
		)
		.post(
			'/by-phone',
			async function getByPhone({ body }) {
				const result = await service.handleGetByPhone(body.phone)
				return res.ok(result)
			},
			{
				body: CustomerGetByPhoneSchema,
				response: createSuccessResponseSchema(CustomerDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: CustomerCreateSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update({ body, auth }) {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: CustomerUpdateSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query }) {
				const result = await service.handleRemove(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/points/add',
			async function addPoints({ body, auth }) {
				const result = await service.handleAddPoints(body, auth.userId)
				return res.ok(result)
			},
			{
				body: CustomerAddPointsSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/points/redeem',
			async function redeemPoints({ body, auth }) {
				const result = await service.handleRedeemPoints(body, auth.userId)
				return res.ok(result)
			},
			{
				body: CustomerRedeemPointsSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.get(
			'/loyalty-history',
			async function loyaltyHistory({ query }) {
				const result = await service.getLoyaltyHistory(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(CustomerLoyaltyTransactionSchema.array()),
				auth: true,
			},
		)
}
