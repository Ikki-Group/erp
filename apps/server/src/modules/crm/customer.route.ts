import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc, zq } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

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
import type { CustomerService } from './customer.service'

export function initCustomerRoute(service: CustomerService) {
	return new Elysia({ prefix: '/customer' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
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
			async function detail(context) {
				const result = await service.handleDetail(context.query.id)
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
			async function getByPhone(context) {
				const result = await service.handleGetByPhone(context.body.phone)
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
			async function create(context) {
				const result = await service.handleCreate(context.body, context.auth.userId)
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
			async function update(context) {
				const result = await service.handleUpdate(context.body, context.auth.userId)
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
			async function remove(context) {
				const result = await service.handleRemove(context.query.id)
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
			async function addPoints(context) {
				const result = await service.handleAddPoints(context.body, context.auth.userId)
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
			async function redeemPoints(context) {
				const result = await service.handleRedeemPoints(context.body, context.auth.userId)
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
			async function loyaltyHistory(context) {
				const result = await service.getLoyaltyHistory(context.query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(CustomerLoyaltyTransactionDto.array()),
				auth: true,
			},
		)
}
