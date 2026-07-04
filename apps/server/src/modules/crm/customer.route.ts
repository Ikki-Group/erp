import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc, zq } from '@/shared/schema'

import {
	CustomerDto,
	CustomerFilterDto,
	CustomerCreateDto,
	CustomerUpdateDto,
	CustomerAddPointsDto,
	CustomerRedeemPointsDto,
	CustomerLoyaltyTransactionDto,
	CustomerGetByPhoneDto,
} from './customer.contract'
import type { CustomerModule } from './customer.module'

export function createCustomerRoute(m: CustomerModule) {
	return new Elysia({ prefix: '/customer' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.handleList(query)
				return res.paginated(result)
			},
			{
				query: CustomerFilterDto,
				response: createPaginatedResponseDto(CustomerDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await m.handleGetById(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(CustomerDto),
				auth: true,
			},
		)
		.post(
			'/by-phone',
			async ({ body }) => {
				const result = await m.handleGetByPhone(body.phone)
				return res.ok(result)
			},
			{
				body: CustomerGetByPhoneDto,
				response: createSuccessResponseDto(CustomerDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await m.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: CustomerCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async ({ body, auth }) => {
				const result = await m.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: CustomerUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ query }) => {
				const result = await m.handleRemove(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/points/add',
			async ({ body, auth }) => {
				const result = await m.handleAddPoints(body, auth.userId)
				return res.ok(result)
			},
			{
				body: CustomerAddPointsDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/points/redeem',
			async ({ body, auth }) => {
				const result = await m.handleRedeemPoints(body, auth.userId)
				return res.ok(result)
			},
			{
				body: CustomerRedeemPointsDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.get(
			'/loyalty-history',
			async ({ query }) => {
				const result = await m.handleLoyaltyHistory(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(CustomerLoyaltyTransactionDto.array()),
				auth: true,
			},
		)
}
